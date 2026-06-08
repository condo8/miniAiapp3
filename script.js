const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ดึงตัวแปร UI ต่างๆ
const currentScoreDoc = document.getElementById("current-score");
const highScoreDoc = document.getElementById("high-score");
const finalScoreDoc = document.getElementById("final-score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

// ตั้งค่าขนาดกริด (Grid System)
const gridSize = 20; 
const tileCount = canvas.width / gridSize;

// ตัวแปรควบคุมสถานะเกม
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0; // ทิศทางแนวนอน
let dy = 0; // ทิศทางแนวตั้ง
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let gameInterval;
let currentSpeed = 120; // ความเร็วเริ่มต้น (มิลลิวินาทีต่อเฟรม) ยิ่งน้อยยิ่งเร็ว
let isGameRunning = false;

// แสดงคะแนนสูงสุดที่บันทึกไว้ตอนโหลดหน้าเว็บ
highScoreDoc.textContent = highScore;

// --- Event Listeners บังคับควบคุม ---
window.addEventListener("keydown", changeDirection);
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

// ฟังก์ชันเริ่มเกมใหม่
function startGame() {
    // รีเซ็ตตัวแปรพื้นฐาน
    snake = [
        { x: 10, y: 10 }, // หัวงู
        { x: 9, y: 10 },  // ตัวงู
        { x: 8, y: 10 }
    ];
    dx = 1; // ให้งูวิ่งไปทางขวาตอนเริ่ม
    dy = 0;
    score = 0;
    currentSpeed = 120;
    isGameRunning = true;
    
    currentScoreDoc.textContent = score;
    
    // ซ่อนหน้าต่าง UI ซ้อนทับ
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    // สุ่มอาหารชิ้นแรก และเริ่มลูปเกม
    generateFood();
    resetGameLoop();
}

// ลูปหลักของเกม (จัดการความเร็วที่เปลี่ยนไปเรื่อยๆ)
function resetGameLoop() {
    clearInterval(gameInterval);
    gameInterval = setInterval(gameStep, currentSpeed);
}

// ฟังก์ชันหลักที่ทำงานในทุกๆ เฟรม
function gameStep() {
    if (checkGameOver()) {
        endGame();
        return;
    }

    clearCanvas();
    drawFood();
    moveSnake();
    drawSnake();
}

// เคลียร์หน้าจอแคนวาสก่อนวาดเฟรมถัดไป
function clearCanvas() {
    ctx.fillStyle = "#232323";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// วาดงูลงบนกระดาน
function drawSnake() {
    snake.forEach((part, index) => {
        // ให้หัวงูสีเขียวเข้ม ตัวงูสีเขียวสว่าง
        ctx.fillStyle = index === 0 ? "#388e3c" : "#4caf50";
        ctx.strokeStyle = "#232323"; // เส้นขอบระหว่างข้อของงู
        
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
        ctx.strokeRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

// จัดการการเคลื่อนที่ของงูและการกินอาหาร
function moveSnake() {
    // คำนวณตำแหน่งหัวงูในเฟรมถัดไป
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head); // เพิ่มหัวใหม่ไปข้างหน้าสุด

    // ตรวจสอบว่างูกินอาหารสำเร็จหรือไม่
    const hasEatenFood = snake[0].x === food.x && snake[0].y === food.y;
    if (hasEatenFood) {
        score += 10;
        currentScoreDoc.textContent = score;
        generateFood();
        
        // ระบบ Speed Up: ทุกๆ 40 คะแนน จะเพิ่มความเร็วขึ้น (ลด Interval ลง)
        if (score % 40 === 0 && currentSpeed > 50) {
            currentSpeed -= 10;
            resetGameLoop();
        }
    } else {
        snake.pop(); // ถ้าไม่ได้กินอาหาร ให้ตัดหางออก (เพื่อให้งูยาวเท่าเดิม)
    }
}

// สุ่มตำแหน่งอาหารใหม่ (ที่ไม่ทับตัวงู)
function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    // ถ้าสุ่มได้ตำแหน่งที่ทับตัวงู ให้สุ่มใหม่รีเคอร์ซีฟ
    const snakeElementTup = snake.some(part => part.x === food.x && part.y === food.y);
    if (snakeElementTup) {
        generateFood();
    }
}

// วาดอาหาร (สีแดงนีออนกลมๆ มินิมอล)
function drawFood() {
    ctx.fillStyle = "#ff5252";
    ctx.beginPath();
    // วาดเป็นวงกลมตรงกลางกริดนั้นๆ
    let radius = (gridSize - 2) / 2;
    let centerX = food.x * gridSize + radius;
    let centerY = food.y * gridSize + radius;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
}

// ตรวจจับปุ่มกดควบคุม (Arrow Keys & WASD) พร้อมระบบล็อกไม่ให้หักหัวกลับทันที
function changeDirection(event) {
    if (!isGameRunning) return;

    const keyPressed = event.key.toLowerCase();
    
    const goingUp = (dy === -1);
    const goingDown = (dy === 1);
    const goingRight = (dx === 1);
    const goingLeft = (dx === -1);

    // กดซ้าย (ลูกศรซ้าย หรือ A) และต้องไม่ได้กำลังวิ่งไปทางขวาอยู่
    if ((keyPressed === "arrowleft" || keyPressed === "a") && !goingRight) {
        dx = -1; dy = 0;
    }
    // กดขวา (ลูกศรขวา หรือ D) และต้องไม่ได้กำลังวิ่งไปทางซ้ายอยู่
    if ((keyPressed === "arrowright" || keyPressed === "d") && !goingLeft) {
        dx = 1; dy = 0;
    }
    // กดขึ้น (ลูกศรขึ้น หรือ W) และต้องไม่ได้กำลังวิ่งลงล่างอยู่
    if ((keyPressed === "arrowup" || keyPressed === "w") && !goingDown) {
        dx = 0; dy = -1;
    }
    // กดลง (ลูกศรลง หรือ S) และต้องไม่ได้กำลังวิ่งขึ้นบนอยู่
    if ((keyPressed === "arrowdown" || keyPressed === "s") && !goingUp) {
        dx = 0; dy = 1;
    }
}

// ตรวจจับลอจิกการชน (Collision Detection)
function checkGameOver() {
    // 1. ชนกำแพงด้านใดด้านหนึ่ง
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x >= tileCount;
    const hitToptWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y >= tileCount;

    if (hitLeftWall || hitRightWall || hitToptWall || hitBottomWall) {
        return true;
    }

    // 2. หัวชนตัวเอง (เช็คว่าหัวงูไปทับส่วนลำตัวชิ้นไหนไหม)
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }

    return false;
}

// จัดการเหตุการณ์เมื่อเกมโอเวอร์
function endGame() {
    clearInterval(gameInterval);
    isGameRunning = false;
    
    // ตรวจสอบและบันทึก High Score ลงเครื่อง
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScore", highScore);
        highScoreDoc.textContent = highScore;
    }

    // แสดงผลหน้าต่าง Game Over
    finalScoreDoc.textContent = score;
    gameOverScreen.classList.remove("hidden");
}