import requests
from flask import Flask, request, jsonify, render_template
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from dotenv import load_dotenv 
import os
import json
import base64
from datetime import datetime
from database import save_game_record, get_game_record, get_last_game_id, get_player_matches
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import random
import google.generativeai as genai
import eventlet
import logging
import re
import uuid

# Flask application initialization
app = Flask(__name__)
CORS(app)
load_dotenv() 

logging.basicConfig(level=logging.INFO)

app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY")

jwt = JWTManager(app)

# Local environment variables
MOCHA_RPC_ORIGINAL = "https://rpc-mocha.pops.one"
KASA_ADDRESS = os.environ.get("WALLET_ADDRESS")
API_KEY = os.environ.get("API_KEY")
RPC_URL = os.environ.get("RPC_URL")
TX_STATUS_URL = os.environ.get("TX_STATUS_URL")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
NAME_SPACE = os.environ.get("NAME_SPACE")
WINNER_MULTIPLIER = 1.8

if not GOOGLE_API_KEY: # Check if the API key is set
    raise ValueError("GOOGLE_API_KEY is not set. Make sure the .env file is properly loaded and contains the key.")

BLOCK_TIME_SECONDS = 5
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

genai.configure(api_key=GOOGLE_API_KEY)

lobbies = {}
TIMER_DURATION = 15  # Question timer
BREAK_DURATION = 5   # Break between questions
model = genai.GenerativeModel("gemini-1.5-pro")

@app.route('/proxy/rpc', methods=['GET', 'POST'])
def proxy_rpc():
    """
    Proxies requests to the MOCHA RPC server.

    Returns:
        tuple: A tuple containing the response content, status code, and headers
    """
    try:
        headers = {"x-api-key": API_KEY} # Add API key to headers
        if request.method == "POST":
            response = requests.post(MOCHA_RPC_ORIGINAL, json=request.get_json(), headers=headers, timeout=10)
        else:
            response = requests.get(MOCHA_RPC_ORIGINAL, headers=headers, timeout=10)
        response.raise_for_status()
        return response.content, 200, {"Content-Type": "application/json"}
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

# Protected route requiring JWT authentication
@app.route('/protected', methods=['POST'])
@jwt_required()
def protected():
    # Get wallet address from JWT token
    wallet_address = get_jwt_identity()
    return jsonify({
        'message': 'Access granted',
        'walletAddress': wallet_address
    })

# Function to transfer funds to a specified address
def transfer_funds(to_address, amount):
    """
    Transfers the specified amount to the given address.
    
    Args:
        to_address (str): The address to send money to
        amount (int/str): The amount to send
    
    Returns:
        dict: Transaction result (response data if successful, error message if failed)
    """
    if not to_address or not amount:
        return {"error": "Missing required parameters"}

    transfer_payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "state.Transfer",
        "params": [
            to_address,
            str(amount),  # Convert amount to string as expected by RPC
            {
                "gas_price": 0.002,
                "is_gas_price_set": True,
                "gas": 142225,
                "signer_address": KASA_ADDRESS,
            }
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
    }

    try:
        # Send request to RPC server
        response = requests.post(RPC_URL, headers=headers, json=transfer_payload)
        response.raise_for_status()  # Raise exception if request fails

        # Return response if successful
        return response.json()
    except requests.exceptions.RequestException as e:
        # Return error message if request fails
        return {"error": f"Failed to transfer: {str(e)}", "status_code": response.status_code if response else 500}

# Function to deliver prize to the winner
def deliver_prize(winner_address, prize_amount=100):
    """
    Delivers the prize to the winning player.
    
    Args:
        winner_address (str): The winner's address
        prize_amount (int): Prize amount (default is 100)
    """
    result = transfer_funds(winner_address, prize_amount)
    if "error" in result:
        print(f"Prize could not be delivered: {result['error']}")
    else:
        print(f"Prize successfully delivered: {prize_amount} sent to {winner_address}")
        print(f"Details: {result}")

# Function to verify a transaction
def verify_transaction(tx_hash, max_age_seconds=120):
    """
    Checks if the given tx_hash is valid and occurred within the last minute.
    
    Args:
        tx_hash (str): The transaction hash to verify
        max_age_seconds (int): The maximum allowed age of the transaction (default is 120 seconds)
    
    Returns:
        tuple: A tuple containing a boolean indicating if the transaction is valid and a message
        describing the result.
    """
    if not tx_hash or not tx_hash.startswith("0x"):
        return False, "Invalid tx_hash format"

    url = f"{TX_STATUS_URL}?hash={tx_hash}"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if "result" not in data:
            return False, "RPC response not in expected format"

        result = data["result"]

        is_committed = result.get("status") == "COMMITTED"
        if not is_committed:
            return False, f"Transaction not COMMITTED, current status: {result.get('status', 'Unknown')}"

        current_height = get_current_block_height()
        tx_height = int(result.get("height", 0))
        
        if current_height is None:
            return False, "COMMITTED transaction verified (time check could not be performed)"

        block_age = current_height - tx_height
        if block_age < 0:
            return False, "Invalid block height (future transaction?)"

        age_in_seconds = block_age * BLOCK_TIME_SECONDS
        if age_in_seconds > max_age_seconds:
            return False, f"Transaction not within the last two minute, age: {age_in_seconds} seconds"

        return True, f"COMMITTED transaction verified, age: {age_in_seconds} seconds (within the last 2 minutes)"

    except requests.exceptions.RequestException as e:
        return False, f"RPC request failed: {str(e)}"
    except ValueError as e:
        return False, f"Block height parse error: {str(e)}"

# Function to get the current block height
def get_current_block_height():
    """
    Retrieves the current block height (hypothetical endpoint).
    
    Returns:
        int: The current block height if successful, otherwise
        None if the request fails or the data is not in the expected format.
    """
    try:
        response = requests.get("https://rpc-mocha.pops.one/block", timeout=10)
        response.raise_for_status()
        data = response.json()
        return int(data["result"]["block"]["header"]["height"])
    except:
        return None

# Route to verify a transaction from the front-end
@app.route('/verify_transfer', methods=['POST'])
def verify_tx():
    """
    Verifies the tx_hash received from the front-end and returns True/False.

    Returns:
        dict: A JSON response containing the verification result
    """
    data = request.get_json()
    tx_hash = data.get('tx_hash')

    if not tx_hash:
        return jsonify({"valid": False, "message": "tx_hash parameter missing"}), 400

    is_valid, message = verify_transaction(tx_hash)
    return jsonify({
        "valid": is_valid,
        "message": message
    }), 200

# Function to manage create standartized game data
def create_game_data(players, bet_amount, scores, winner, questions, timestamp=None):
    """
    Creates a standardized game data object for saving to the blockchain.
    
    Args:
        players (list): List of player wallet addresses
        bet_amount (int): The amount bet on the game
        scores (dict): Dictionary of player scores
        winner (str): The wallet address of the winner
        questions (list): List of questions and answers
        timestamp (str): The timestamp of the game (default is current time)
    
    Returns:
        dict: The standardized game data object for saving to the blockchain as a blob record
    """
    if not isinstance(players, list) or len(players) < 2:
        raise ValueError("players must be a list with at least 2 players")
    if not isinstance(bet_amount, (int, float)) or bet_amount < 0:
        raise ValueError("bet_amount must be a positive number")
    if not isinstance(scores, dict) or len(scores) != len(players):
        raise ValueError("scores must be a dictionary for all players")
    
    standardized_players = []
    player_wallets = []
    for p in players:
        if isinstance(p, str):
            standardized_players.append({"wallet": p})
            player_wallets.append(p)
        elif isinstance(p, dict) and "wallet" in p:
            standardized_players.append({"wallet": p["wallet"]})
            player_wallets.append(p["wallet"])
        else:
            raise ValueError("players list must contain strings or {'wallet': '...'} format")
    
    if winner not in player_wallets:
        raise ValueError("winner must be among the players")
    
    if not isinstance(questions, list) or len(questions) == 0:
        raise ValueError("questions must be a non-empty list")

    if timestamp is None:
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    else:
        try:
            datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise ValueError("timestamp format must be 'YYYY-MM-DD HH:MM:SS'")

    standardized_questions = []
    for q in questions:
        if not all(k in q for k in ["question", "answers", "correct"]):
            raise ValueError("Each question must have 'question', 'answers', and 'correct'")
        standardized_questions.append({
            "question": q["question"],
            "answers": q["answers"],
            "correct": q["correct"]
        })

    game_id = get_last_game_id() + 1

    game_data = {
        "game_id": game_id,
        "players": standardized_players,
        "bet_amount": bet_amount,
        "scores": scores,
        "winner": winner,
        "timestamp": timestamp,
        "questions": standardized_questions
    }
    return game_data

# Function to save game records
def save_records(game_data, namespace=NAME_SPACE, wallet_address=KASA_ADDRESS):
    """
    Saves the game data to the blockchain as a blob record.
    
    Args:
        game_data (dict): The game data object to save
        namespace (str): The namespace to save the data under
        wallet_address (str): The wallet address to sign the transaction
    
    Returns:
        dict: The response from the blob submission
    """
    if not namespace or not game_data or not wallet_address:
        return {"error": "Missing parameter: namespace, game_data, wallet_address required"}

    try:
        game_json = json.dumps(game_data)
        base64_data = base64.b64encode(game_json.encode()).decode()
    except Exception as e:
        return {"error": "Game data could not be encoded", "message": str(e)}

    headers = {"Content-Type": "application/json", "x-api-key": API_KEY}
    payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "blob.Submit",
        "params": [
            [{"namespace": namespace, "data": base64_data}],
            {"gas_price": 0.002, "is_gas_price_set": True, "signer_address": wallet_address}
        ]
    }

    try:
        response = requests.post(RPC_URL, json=payload, headers=headers)
        if response.status_code != 200:
            return {"error": "Blob submission failed", "details": response.json()}

        result = response.json()
        block_height = result.get("result")

        player1_wallet = game_data["players"][0]["wallet"]
        player2_wallet = game_data["players"][1]["wallet"]

        record_id = save_game_record(player1_wallet, player2_wallet, block_height, namespace)
        if not record_id:
            return {"error": "Database save failed"}

        return {
            "message": "Blob submitted successfully",
            "block_height": block_height,
            "namespace": namespace,
            "game_id": record_id
        }
    except requests.exceptions.RequestException as e:
        return {"error": "Request failed", "message": str(e)}

# Function to fetch game data from a blob
def fetch_blob_game_data(block_height, namespace):
    """
    Fetches game_data from a blob with the specified block_height and namespace.
    
    Args:
        block_height (int): The block height of the blob
        namespace (str): The namespace of the blob
    
    Returns:
        dict: The game data from the blob
    """
    headers = {"Content-Type": "application/json", "x-api-key": API_KEY}
    payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "blob.GetAll",  # Using blob.GetAll instead of blob.Get
        "params": [block_height, [namespace]]
    }

    try:
        response = requests.post(RPC_URL, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"Blob.GetAll request failed: {response.status_code}, {response.text}")
            return None
        
        data = response.json()
        if "result" not in data or not isinstance(data["result"], list) or len(data["result"]) == 0:
            print(f"Invalid response: {data}")
            return None
        
        # Get and decode the first blob's data
        blob_data = data["result"][0].get("data", "")
        if not blob_data:
            print("No data field found in blob")
            return None
        
        # Decode from base64 to JSON
        decoded_base64 = base64.b64decode(blob_data).decode("utf-8")
        game_data = json.loads(decoded_base64)
        return game_data

    except requests.exceptions.RequestException as e:
        print(f"Blob fetch error: {e}")
        return None
    except (base64.binascii.Error, json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"Blob decode error: {e}")
        return None

# Route to get a specific game record
@app.route('/get_game_record/<int:game_id>', methods=['GET'])
@jwt_required()
def get_game(game_id):
    """
    Retrieves the game record with the specified ID.

    Args:
        game_id (int): The ID of the game record to retrieve

    Returns:
        dict: The game record if found, otherwise an error message
    """
    record = get_game_record(game_id)
    if not record:
        return jsonify({"error": "Game record not found"}), 404

    game_data = fetch_blob_game_data(record["block_height"], record["namespace"])
    if game_data:
        return jsonify(game_data), 200
    return jsonify({"error": "Blob data could not be retrieved", "record": record}), 500

# Route to get a player's match history
@app.route('/get_player_history', methods=['GET'])
@jwt_required()
def get_player_history():
    """
    Retrieves the match history for the current user.

    Returns:
        dict: The match history for the current user
    """
    current_user = get_jwt_identity()
    try:
        matches = get_player_matches(current_user)
        history = [{
            "game_id": match[0],
            "player1": match[1],
            "player2": match[2],
            "block_height": match[3],
            "namespace": match[4],
            "is_player1": match[1] == current_user
        } for match in matches]
        
        return jsonify({"matches": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def generate_questions(topic):
    """
    Generates a set of challenging trivia questions on the specified topic.

    Args:
        topic (str): The topic for the trivia questions
    
    Returns:
        list: A list of 5 trivia questions and answers
    """
    
    prompt = f"""
    Generate exactly 5 **challenging and uncommon** trivia questions about {topic} that require **deep knowledge** and are **hard to quickly Google**. 
    The answer must be **a single numeric value (integer only, no text, no words, no scientific notation).**

    ### **FORMAT STRICTLY AS FOLLOWS:**
    Question: [Complex trivia question]
    Answer: [Only a numeric value]

    ### **EXAMPLES:**
    Question: In what year was the world's first electronic general-purpose computer (ENIAC) fully operational?
    Answer: 1945

    Question: How many bones does a typical adult human body have after all growth plates are fused?
    Answer: 206

    Question: What is the total number of symphonies composed by Ludwig van Beethoven?
    Answer: 9

    DO NOT provide any explanations, units, words, or additional text. The answer must be a raw number only.
    Ensure there are exactly 5 questions, and all answers are properly formatted.
    """
    logging.info(f"Generating questions for topic: {topic}...")
    model = genai.GenerativeModel("gemini-1.5-pro")
    try:
        response = model.generate_content(prompt)
        if not response.text:
            raise ValueError("Empty response from model.")
    except Exception as e:
        logging.error(f"Error generating questions: {e}")
        return []

    lines = response.text.strip().split("\n")
    questions = []
    
    for i in range(len(lines) - 1):  
        question_match = re.match(r"Question:\s*(.*)", lines[i], re.IGNORECASE) 
        answer_match = re.match(r"Answer:\s*(\d+)", lines[i + 1], re.IGNORECASE) 

        if question_match and answer_match:
            question_text = question_match.group(1).strip()
            answer_value = int(answer_match.group(1))  # Convert answer to integer

            questions.append({"question": question_text, "answer": answer_value})
        else:
            logging.error(f"Failed to parse question from: {lines[i]} and {lines[i + 1]}")

    if len(questions) < 5:
        logging.error("Less than 5 valid questions generated. Returning empty list.") 
        return []

    logging.info(f"Generated questions: {questions}")
    return questions

def start_game(lobby_id):
    """
    Starts the game in the specified lobby.

    Args:
        lobby_id (str): The ID of the lobby to start the game
    """
    logging.info(f"Starting game in lobby {lobby_id}")
    lobby = lobbies[lobby_id]
    lobby['counter'] = 0
    lobby['status'] = 'playing'
    lobby['question_queue'] = generate_questions(lobby['topic'])
    lobby['current_question'] = 0
    lobby['guesses'] = {}
    lobby['data'] = []
    start_new_round(lobby_id) # Start the first round

def start_new_round(lobby_id):
    """
    Starts a new round in the specified lobby.

    Args:
        lobby_id (str): The ID of the lobby to start a new round in 
    """
    lobby = lobbies[lobby_id]
    if not lobby['question_queue']: # No more questions left
        end_game(lobby_id)
        return

    lobby['current_question_data'] = lobby['question_queue'].pop(0) # Get the next question
    lobby['guesses'] = {}
    
    logging.info(f"Sending new_round to lobby {lobby_id}: {lobby['current_question_data']['question']}")
    socketio.emit("new_round", {
        "question": lobby['current_question_data']['question'],
        "players": list(lobby['players'].keys()),
        "scores": lobby['scores'],
        "timer": TIMER_DURATION
    }, room=lobby_id)
    
    eventlet.sleep(TIMER_DURATION) # Wait for the timer to expire
    evaluate_guesses(lobby_id) # Evaluate the guesses

def evaluate_guesses(lobby_id):
    """
    Evaluates the guesses in the specified lobby and determines the winner.

    Args:
        lobby_id (str): The ID of the lobby to evaluate guesses in
    """
    logging.info(f"Evaluating guesses in lobby {lobby_id}")
    lobby = lobbies[lobby_id]
    correct_answer = lobby['current_question_data']['answer']
    guesses = lobby['guesses']
    players = list(lobby['players'].keys()) 
    scores = lobby['scores']
    guess_dict = {'question': lobby['question_queue'][lobby["counter"]], 'answers': guesses, 'correct': correct_answer}
    if not guesses:
        result = {"correct_answer": correct_answer, "winner": None}
    else:
        valid_guesses = {user: guess for user, guess in guesses.items() if guess is not None}
        if valid_guesses:
            winner = min(valid_guesses, key=lambda user: abs(valid_guesses[user] - correct_answer))
            lobby['scores'][winner] += 1
            result = {"correct_answer": correct_answer, "winner": winner}
        else: # No valid guesses
            result = {"correct_answer": correct_answer, "winner": None}
    
    eventlet.sleep(BREAK_DURATION)
    
    if max(lobby['scores'].values(), default=0) >= 3 or not lobby['question_queue']: # End game if a player reaches 3 points or no questions left
        end_game(lobby_id)
    else:
        lobby['data'].append(guess_dict) # Save the question data
        start_new_round(lobby_id) # Start a new round
        lobby["counter"] += 1 

def end_game(lobby_id):
    """
    Ends the game in the specified lobby and determines the winner.
    
    Args:
        lobby_id (str): The ID of the lobby to end the game in
    """
    logging.info(f"Ending game in lobby {lobby_id}")
    
    lobby = lobbies[lobby_id]
    winner = max(lobby['scores'], key=lobby['scores'].get) if lobby['scores'] else None
    bet = lobby['bet']

    dist_bet = bet * WINNER_MULTIPLIER # Distribute the prize to the winner
    deliver_prize(winner, dist_bet) # Deliver the prize to the winner

    logging.info(f"Prize delivered to {winner} in lobby {lobby_id}")
    logging.info(f"players: {lobby['players']}\n\n bet: {bet}\n\n scores: {lobby['scores']}\n\n winner: {winner}\n\n question_queue: {lobby['question_queue']}\n\n timestamp: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
    
    game_data = create_game_data(list(lobby['players'].keys()), bet, lobby['scores'], winner, lobby['data'], timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
    save_records(game_data)
    
    logging.info(f"Game data saved for lobby {lobby_id}, Game Data: {game_data}")
    
    socketio.emit("game_over", {"winner": winner, "scores": lobby['scores']}, room=lobby_id)
    logging.info(f"Game over in lobby {lobby_id}. Winner: {winner}")

@app.route("/")
def index():
    """
    Returns the index page.
    """
    logging.info("Returning API status")
    return jsonify({"message": "Quiz Game API is running", "version": "1.0"}), 200

@app.route("/api/lobbies", methods=["GET"])
def get_lobbies_json():
    """
    Returns the list of lobbies as a JSON response.
    """
    logging.info("Returning lobbies as JSON")
    return jsonify(lobbies), 200

@app.route("/create_lobby", methods=["POST"])
def create_lobby():
    """
    Creates a new lobby with the specified parameters.
    """
    username = request.form['username']
    bet = int(request.form['bet'])
    topic = request.form['topic']
    
    lobby_id = str(uuid.uuid4()) # Generate a unique lobby ID

    lobbies[lobby_id] = {        
        'owner': username,
        'players': {username: {'ready': False}},
        'scores': {username: 0},
        'bet': bet,
        'topic': topic,
        'status': 'waiting'
    }
    logging.info(f"New lobby created: {lobby_id} by {username}")
    return jsonify({'lobby_id': lobby_id, 'username': username}), 201

@app.route("/api/lobby/<lobby_id>", methods=["GET"])
def get_lobby_json(lobby_id):
    """
    Returns the specified lobby as a JSON response.
    """
    if lobby_id not in lobbies:
        logging.error(f"Lobby {lobby_id} not found")
        return jsonify({"error": "Lobby not found"}), 404
    logging.info(f"Returning lobby {lobby_id} as JSON")
    return jsonify(lobbies[lobby_id]), 200

@app.route("/api/game/<lobby_id>", methods=["GET"])
def get_game_json(lobby_id):
    """
    Returns the game state for the specified lobby as a JSON response.
    """
    if lobby_id not in lobbies or lobbies[lobby_id]['status'] != 'playing':
        logging.error(f"Game not found or not started for lobby {lobby_id}")
        return jsonify({"error": "Game not found or not started"}), 404
    logging.info(f"Returning game state for {lobby_id} as JSON")
    return jsonify({
        "lobby_id": lobby_id,
        "current_question": lobbies[lobby_id].get('current_question_data', {}),
        "players": lobbies[lobby_id]['players'],
        "scores": lobbies[lobby_id]['scores'],
        "status": "playing"
    }), 200

@socketio.on("join_lobby")
def handle_join_lobby(data):
    """
    Handles a player joining a lobby.
    """
    lobby_id = data['lobby_id']
    username = data['username']
    if lobby_id not in lobbies:
        emit("error", {"message": "Lobby not found"}, to=request.sid)
        logging.error(f"Join attempt to non-existent lobby: {lobby_id}")
        return
    
    lobby = lobbies[lobby_id]
    logging.info(f"Join attempt to lobby {lobby_id} by {username}")
    if username in lobby['players']:
        logging.info(f"{username} already in lobby {lobby_id}, updating connection")
        join_room(lobby_id)
        emit("lobby_update", lobby, room=lobby_id)
        return
    
    lobby['players'][username] = {'ready': False}
    lobby['scores'][username] = 0
    join_room(lobby_id) # Join the lobby room
    logging.info(f"{username} joined lobby {lobby_id}")
    emit("lobby_update", lobby, room=lobby_id)

@socketio.on("ready")
def handle_ready(data):
    """
    Handles a player being ready in the lobby
    """
    lobby_id = data['lobby_id']
    username = data['username']
    
    if lobby_id in lobbies and username in lobbies[lobby_id]['players']:
        lobbies[lobby_id]['players'][username]['ready'] = True
        logging.info(f"{username} is ready in {lobby_id}")
        
        emit("lobby_update", lobbies[lobby_id], room=lobby_id)
        
        if len(lobbies[lobby_id]['players']) == 2 and all(player['ready'] for player in lobbies[lobby_id]['players'].values()):
            logging.info(f"All players ready in {lobby_id}, starting game")
            socketio.start_background_task(start_game, lobby_id) # Start the game
            emit("start_game", {"lobby_id": lobby_id}, room=lobby_id)

@socketio.on("submit_guess")
def handle_submit_guess(data):
    """
    Handles a player submitting a guess in the lobby.
    """
    lobby_id = data['lobby_id']
    username = data['username']
    guess = data['guess']
    
    try:
        guess = int(guess)
        if username in lobbies[lobby_id]['players']:
            lobbies[lobby_id]['guesses'][username] = guess
            logging.info(f"{username} submitted guess {guess} in {lobby_id}")
    except ValueError:
        emit("error", {"message": "Invalid integer format"}, to=request.sid)

@socketio.on("leave_lobby")
def handle_leave_lobby(data):
    """
    Handles a player leaving the lobby.
    """
    lobby_id = data['lobby_id']
    username = data['username']
    
    if lobby_id in lobbies and username in lobbies[lobby_id]['players']:
        del lobbies[lobby_id]['players'][username]
        del lobbies[lobby_id]['scores'][username]
        leave_room(lobby_id)
        logging.info(f"{username} left lobby {lobby_id}")
        
        if len(lobbies[lobby_id]['players']) == 0:
            del lobbies[lobby_id]
        elif len(lobbies[lobby_id]['players']) == 1 and lobbies[lobby_id]['status'] == 'playing':
            winner = list(lobbies[lobby_id]['players'].keys())[0]
            end_game(lobby_id)
        
        if lobby_id in lobbies:
            emit("lobby_update", lobbies[lobby_id], room=lobby_id)

# Run the Flask application
if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", debug=True, port=5001) # host is important for Docker to work properly