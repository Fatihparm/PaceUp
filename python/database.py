# database.py
import psycopg2
from psycopg2 import Error

# Veritabanı bağlantı bilgileri (kendi bilgilerine göre güncelle)
DB_CONFIG = {
    "dbname": "mamathon",
    "user": "postgres",
    "password": "brokolif",
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    """
    Sets up a connection to the database and returns the connection object.

    Returns:
        psycopg2.connection: A connection object to the database.
    """
    try:
        return psycopg2.connect(**DB_CONFIG)
    except Error as e:
        print(f"Veritabanına bağlanırken hata: {e}")
        return None

def init_db():
    """
    Initializes the database by creating the necessary tables if they do not exist
    """
    conn = get_db_connection()
    if conn is None:
        return

    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS game_records (
                    id SERIAL PRIMARY KEY,
                    player1_wallet TEXT NOT NULL,
                    player2_wallet TEXT NOT NULL,
                    block_height INTEGER NOT NULL,
                    namespace TEXT NOT NULL
                );
            """)
            conn.commit()
        print("game_records tablosu oluşturuldu veya zaten var.")
    except Error as e:
        print(f"Tablo oluşturulurken hata: {e}")
    finally:
        conn.close()

def save_game_record(player1_wallet, player2_wallet, block_height, namespace):
    """
    Saves a game record to the database.

    Args:
        player1_wallet (str): The wallet address of the first player.
        player2_wallet (str): The wallet address of the second player.
        block_height (int): The block height at which the game was played.
        namespace (str): The namespace of the game.
    
    Returns:
        int: The ID of the newly inserted record if successful, False otherwise.
    """
    conn = get_db_connection()
    if conn is None:
        return False

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO game_records (player1_wallet, player2_wallet, block_height, namespace)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
            """, (player1_wallet, player2_wallet, block_height, namespace))
            record_id = cur.fetchone()[0]
            conn.commit()
            return record_id
    except Error as e:
        print(f"Kayıt eklenirken hata: {e}")
        return False
    finally:
        conn.close()

def get_game_record(game_id):
    """
    Retrieves a game record from the database.
    
    Args:
        game_id (int): The ID of the game record to retrieve.
    
    Returns:
        dict: A dictionary containing the game record if found, None otherwise.
    """
    conn = get_db_connection()
    if conn is None:
        return None

    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, player1_wallet, player2_wallet, block_height, namespace
                FROM game_records
                WHERE id = %s;
            """, (game_id,))
            result = cur.fetchone()
            if result:
                return {
                    "game_id": result[0],
                    "player1_wallet": result[1],
                    "player2_wallet": result[2],
                    "block_height": result[3],
                    "namespace": result[4]
                }
            return None
    except Error as e:
        print(f"Kayıt getirilirken hata: {e}")
        return None
    finally:
        conn.close()

def get_last_game_id():
    """
    Retrieves the ID of the last game record in the database.

    Returns:
        int: The ID of the last game record if found, 0 otherwise
    """
    conn = get_db_connection()
    if conn is None:
        return 0

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT MAX(id) FROM game_records;")
            result = cur.fetchone()[0]
            return result if result is not None else 0
    except Error as e:
        print(f"Son id alınırken hata: {e}")
        return 0
    finally:
        conn.close()

def get_player_matches(user_wallet):
    """
    Retrieves all game records that the given user participated in.

    Args:
        user_wallet (str): The wallet address of the user.
    
    Returns:
        list: A list of dictionaries containing the game records if found, an empty list otherwise.
    """
    conn = get_db_connection()
    if conn is None:
        return 0
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, player1_wallet, player2_wallet, block_height, namespace
            FROM game_records
            WHERE player1_wallet = %s OR player2_wallet = %s
            ORDER BY id DESC
        """, (user_wallet, user_wallet))
        return cur.fetchall()

if __name__ == "__main__":
    init_db()