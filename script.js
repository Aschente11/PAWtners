// Optimized mobile performance
let draggedItem = null;
let draggedElement = null;
let draggedPetTarget = null;
let touchClone = null;
let desktopClone = null;
let activeDropZone = null;

const petSounds = {
    max: document.getElementById("sound-max"),
    luna: document.getElementById("sound-luna"),
    buddy: document.getElementById("sound-buddy"),
    whiskers: document.getElementById("sound-whiskers")
};


function updateHearts(petElement, happiness) {
    const heartsDisplay = petElement.parentElement.querySelector('.hearts-display');
    const petName = petElement.dataset.pet;

    // Use red hearts (❤️) for filled and empty hearts (♡) for unfilled
    heartsDisplay.textContent = "❤️".repeat(happiness) + "♡".repeat(4 - happiness);

    if (happiness === 4) {
        const sound = petSounds[petName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log("Audio play failed:", error);
            });
        }
    }
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Pet interaction
function petAnimal(element) {
    element.classList.add('happy');
    setTimeout(() => element.classList.remove('happy'), 500);
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 3; i++) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.textContent = ['💕', '💖', '💗'][i];
        heart.style.left = centerX + (Math.random() - 0.5) * 60 + 'px';
        heart.style.top = centerY + 'px';
        heart.style.animationDelay = i * 0.1 + 's';
        document.body.appendChild(heart);
        
        setTimeout(() => heart.remove(), 1500);
    }
}

// Initialize drag and drop
document.querySelectorAll('.item').forEach(item => {
    // Touch events for mobile
    item.addEventListener('touchstart', handleTouchStart, { passive: false });
    item.addEventListener('touchmove', handleTouchMove, { passive: false });
    item.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Mouse events for desktop
    item.addEventListener('mousedown', handleMouseDown);
});

function handleTouchStart(e) {
    e.preventDefault();
    const item = e.target;
    draggedItem = item.dataset.item;
    draggedPetTarget = item.dataset.petTarget;
    draggedElement = item;
    item.classList.add('dragging');
    
    const touch = e.touches[0];
    createTouchClone(item, touch.clientX, touch.clientY);
}

function handleTouchMove(e) {
    if (!draggedElement) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    updateTouchClone(touch.clientX, touch.clientY);
    checkDropZone(touch.clientX, touch.clientY);
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!draggedElement) return;
    
    const touch = e.changedTouches[0];
    const dropZone = findDropZone(touch.clientX, touch.clientY);
    
    if (dropZone && draggedPetTarget === dropZone.dataset.pet) {
        handleDrop(dropZone, draggedItem, draggedElement);
    }
    
    cleanupDrag();
}

function handleMouseDown(e) {
    e.preventDefault();
    const item = e.target;
    draggedItem = item.dataset.item;
    draggedPetTarget = item.dataset.petTarget;
    draggedElement = item;
    item.classList.add('dragging');
    
    createDesktopClone(item, e.clientX, e.clientY);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e) {
    if (!draggedElement) return;
    updateDesktopClone(e.clientX, e.clientY);
    checkDropZone(e.clientX, e.clientY);
}

function handleMouseUp(e) {
    if (!draggedElement) return;
    
    const dropZone = findDropZone(e.clientX, e.clientY);
    if (dropZone && draggedPetTarget === dropZone.dataset.pet) {
        handleDrop(dropZone, draggedItem, draggedElement);
    }
    
    cleanupDrag();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
}

function createTouchClone(item, x, y) {
    touchClone = item.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.left = x - 30 + 'px';
    touchClone.style.top = y - 30 + 'px';
    touchClone.style.zIndex = '10000';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.transform = 'scale(1.3)';
    touchClone.id = 'drag-clone';
    document.body.appendChild(touchClone);
}

function updateTouchClone(x, y) {
    if (touchClone) {
        touchClone.style.left = x - 30 + 'px';
        touchClone.style.top = y - 30 + 'px';
    }
}

function createDesktopClone(item, x, y) {
    desktopClone = item.cloneNode(true);
    desktopClone.style.position = 'fixed';
    desktopClone.style.left = x - 35 + 'px';
    desktopClone.style.top = y - 35 + 'px';
    desktopClone.style.zIndex = '10000';
    desktopClone.style.pointerEvents = 'none';
    desktopClone.style.transform = 'scale(1.3)';
    desktopClone.style.filter = 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.3))';
    desktopClone.id = 'desktop-drag-clone';
    document.body.appendChild(desktopClone);
}

function updateDesktopClone(x, y) {
    if (desktopClone) {
        desktopClone.style.left = x - 35 + 'px';
        desktopClone.style.top = y - 35 + 'px';
    }
}

function findDropZone(x, y) {
    const elements = document.elementsFromPoint(x, y);
    return elements.find(el => el.classList.contains('drop-zone'));
}

function checkDropZone(x, y) {
    const dropZone = findDropZone(x, y);
    
    if (dropZone && draggedPetTarget === dropZone.dataset.pet) {
        if (activeDropZone !== dropZone) {
            if (activeDropZone) {
                activeDropZone.classList.remove('drag-over');
            }
            dropZone.classList.add('drag-over');
            activeDropZone = dropZone;
        }
    } else if (activeDropZone) {
        activeDropZone.classList.remove('drag-over');
        activeDropZone = null;
    }
}

function cleanupDrag() {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
    if (touchClone) {
        touchClone.remove();
        touchClone = null;
    }
    if (desktopClone) {
        desktopClone.remove();
        desktopClone = null;
    }
    if (activeDropZone) {
        activeDropZone.classList.remove('drag-over');
        activeDropZone = null;
    }
    draggedItem = null;
    draggedPetTarget = null;
    draggedElement = null;
}

function handleDrop(zone, item, itemElement) {
    if (!item || !itemElement) return;

    const petName = zone.dataset.pet;
    let happiness = parseInt(zone.dataset.happiness) || 0;
    happiness++;
    zone.dataset.happiness = happiness;

    // Update hearts display
    updateHearts(zone, happiness);

    // Update pet image
    updatePetImage(zone, petName, happiness);

    // Hide the used item
    itemElement.classList.add('used');
    setTimeout(() => {
        itemElement.style.visibility = 'hidden';
    }, 400);

    // Add happy animation
    zone.classList.add('happy');
    setTimeout(() => zone.classList.remove('happy'), 500);

    // Show floating hearts and message
    createFloatingHearts(zone);
    showItemMessage(zone, ['😋', '💧', '🎾', '🦴'][Math.floor(Math.random() * 4)]);
}


function updatePetImage(zone, petName, happiness) {
    const petImg = zone.querySelector('.pet-img');
    
    const petImages = {
        max: {
            sad: 'pets/sadDog.jpeg',
            happy: 'pets/happydog.jpg'
        },
        luna: {
            sad: 'pets/sadcat.png',
            happy: 'pets/happycat.png'
        },
        buddy: {
            sad: 'pets/sadDog2.jpeg',
            happy: 'pets/happydog2.jpg'
        },
        whiskers: {
            sad: 'pets/sadcat2.jpg',
            happy: 'pets/happycat2.jpg'
        }
    };
    
    if (happiness >= 4) {
        petImg.src = petImages[petName].happy;
    }
}

function createFloatingHearts(zone) {
    const rect = zone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 3; i++) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.textContent = ['❤️', '💕', '💖'][i];
        heart.style.left = centerX + (Math.random() - 0.5) * 60 + 'px';
        heart.style.top = centerY + 'px';
        heart.style.animationDelay = i * 0.1 + 's';
        document.body.appendChild(heart);
        
        setTimeout(() => heart.remove(), 1500);
    }
}

function showItemMessage(zone, message) {
    const rect = zone.getBoundingClientRect();
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top - 40}px;
        transform: translate(-50%, 0);
        font-size: 28px;
        z-index: 1000;
        pointer-events: none;
        animation: messageFade 1s ease-out forwards;
    `;
    msg.textContent = message;
    document.body.appendChild(msg);
    
    if (!document.getElementById('message-animation')) {
        const style = document.createElement('style');
        style.id = 'message-animation';
        style.textContent = `
            @keyframes messageFade {
                0% { opacity: 0; transform: translate(-50%, 0); }
                30% { opacity: 1; transform: translate(-50%, -10px); }
                100% { opacity: 0; transform: translate(-50%, -30px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => msg.remove(), 1000);
}

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const card = entry.target.querySelector('.pet-card');
            if (card) {
                card.classList.add('visible');
            }
        }
    });
}, { 
    threshold: 0.15,
    rootMargin: '0px'
});

document.querySelectorAll('.section').forEach(section => observer.observe(section));

// Scroll to event
function scrollToEvent(petName) {
    const eventSection = document.getElementById('event-details');
    eventSection.scrollIntoView({ behavior: 'smooth' });
}

// Modal functions
function closeModal() {
    const modal = document.getElementById('adoptModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

document.getElementById('adoptModal').addEventListener('click', (e) => {
    if (e.target.id === 'adoptModal') {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Smooth anchor scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Prevent scroll bounce on iOS
document.body.addEventListener('touchmove', function(e) {
    if (e.target.closest('.container')) {
        return;
    }
    e.preventDefault();
}, { passive: false });

// Performance optimization: Reduce animations when scrolling
let scrollTimeout;
const container = document.querySelector('.container');

container.addEventListener('scroll', () => {
    document.body.classList.add('scrolling');
    
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        document.body.classList.remove('scrolling');
    }, 150);
}, { passive: true });