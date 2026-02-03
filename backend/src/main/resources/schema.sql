-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    profile_image VARCHAR(255),
    full_name VARCHAR(255),
    occupation VARCHAR(255),
    address VARCHAR(500),
    phone_number VARCHAR(20),
    date_of_birth VARCHAR(20),
    bio TEXT
);

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATETIME NOT NULL,
    type VARCHAR(50) NOT NULL,
    payment_method VARCHAR(100),
    currency VARCHAR(50),
    user_id BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Goals Table
CREATE TABLE IF NOT EXISTS goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    goal_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    target_amount DECIMAL(19,2) NOT NULL,
    current_amount DECIMAL(19,2) DEFAULT 0,
    deadline DATE,
    priority VARCHAR(50),
    created_at DATE NOT NULL,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Posts Table
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    user_id BIGINT NOT NULL,
    likes INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    likes INT DEFAULT 0,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Likes Table
CREATE TABLE IF NOT EXISTS likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(post_id, user_id)
);

-- Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    language VARCHAR(100) NOT NULL DEFAULT 'us English',
    currency VARCHAR(100) NOT NULL DEFAULT 'INR (₹) - Indian Rupee',
    monthly_income VARCHAR(100),
    risk_tolerance VARCHAR(255) NOT NULL DEFAULT 'Moderate - Balanced approach to risk and return',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Indexes (MySQL specific syntax handled by CREATE INDEX if not handled by DDL auto)
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);
-- CREATE UNIQUE INDEX idx_users_email ON users(email); -- Already unique constraint in table DDL
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_created_at ON goals(created_at);
CREATE INDEX idx_settings_user_id ON settings(user_id);