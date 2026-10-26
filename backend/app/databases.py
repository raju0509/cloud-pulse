import os
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row


@contextmanager
def get_db_connection():
    connection = psycopg.connect(
        host=os.environ["DATABASE_HOST"],
        port=int(os.getenv("DATABASE_PORT", "5432")),
        dbname=os.environ["DATABASE_NAME"],
        user=os.environ["DATABASE_USER"],
        password=os.environ["DATABASE_PASSWORD"],
        connect_timeout=5,
        row_factory=dict_row,
    )

    try:
        yield connection
    finally:
        connection.close()