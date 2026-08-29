CREATE TABLE IF NOT EXISTS typing_status (
    user_id INTEGER NOT NULL,
    peer_id INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, peer_id)
);