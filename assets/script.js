// Lead Agents Studio V3 — Light Theme with Animated Lighting

document.addEventListener('DOMContentLoaded', () => {
    initStickyBar();
    initFormHandling();
    initScrollAnimations();
    initLightBeamInteraction();
    initPhoneParallax();
    initMouseGlow();
});

// Smooth Scroll
function scrollToDemo() {
    const demoSection = document.getElementById('demo');
    if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            document.getElementById('name')?.focus();
        }, 800);
    }
}

function scrollToMechanism() {
    const mechanismSection = document.getElementById('mechanism');
    if (mechanismSection) {
        mechanismSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Sticky Bar
function initStickyBar() {
    const stickyBar = document.querySelector('.sticky-bar');
    if (!stickyBar) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 200) {
            stickyBar.classList.add('visible');
        } else {
            stickyBar.classList.remove('visible');
        }
    }, { passive: true });
}

// Form Handling
function initFormHandling() {
    const demoForm = document.getElementById('demoForm');
    if (!demoForm) return;
    
    demoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(demoForm);
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            channel: formData.get('channel')
        };
        
        console.log('Form submitted:', data);
        
        // Validate phone number format
        if (!data.phone.startsWith('+')) {
            showFormError('phone', 'Please include country code (e.g., +1 for US, +972 for Israel)');
            return;
        }
        
        // Show loading
        const btn = demoForm.querySelector('button[type="submit"]');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span class="btn-shine"></span>Starting demo...';
        btn.disabled = true;
        
        try {
            // Call the backend API
            // In production: use HTTPS and your actual domain
            // For local dev: use localhost:3001
            const apiUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3001/api/demo/start'
                : `${window.location.origin}/api/demo/start`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',  // Include cookies for same-origin requests
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Demo started:', result);
                showDemoPanel();
                demoForm.reset();
            } else {
                throw new Error(result.error || 'Failed to start demo');
            }
        } catch (error) {
            console.error('Error starting demo:', error);
            showFormError('general', error.message || 'Failed to start demo. Please try again.');
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    });
}

// Show form error
function showFormError(field, message) {
    // Remove existing errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.form-group.has-error').forEach(el => el.classList.remove('has-error'));
    
    if (field === 'general') {
        // Show general error at top of form
        const form = document.getElementById('demoForm');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message general-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = 'background: rgba(255, 59, 139, 0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: center;';
        form.insertBefore(errorDiv, form.firstChild);
    } else {
        // Show field-specific error
        const input = document.getElementById(field);
        if (input) {
            const formGroup = input.closest('.form-group');
            formGroup.classList.add('has-error');
            
            const errorSpan = document.createElement('span');
            errorSpan.className = 'error-message';
            errorSpan.textContent = message;
            formGroup.appendChild(errorSpan);
        }
    }
}

// Demo Panel
function showDemoPanel() {
    const panel = document.getElementById('demoPanel');
    if (panel) {
        panel.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeDemoPanel() {
    const panel = document.getElementById('demoPanel');
    if (panel) {
        panel.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDemoPanel();
});

// Close on backdrop click
document.getElementById('demoPanel')?.addEventListener('click', (e) => {
    if (e.target.id === 'demoPanel') closeDemoPanel();
});

// Scroll Animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Stagger children
                const children = entry.target.querySelectorAll('.step-card, .showcase-card, .faq-item, .feature-col');
                children.forEach((child, i) => {
                    child.style.transitionDelay = `${i * 0.1}s`;
                    child.classList.add('visible');
                });
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
}

// Light Beam Interaction - beams follow scroll
function initLightBeamInteraction() {
    const beams = document.querySelectorAll('.beam');
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollPercent = window.pageYOffset / (document.body.scrollHeight - window.innerHeight);
                
                beams.forEach((beam, index) => {
                    const offset = scrollPercent * 100 * (index + 1) * 0.5;
                    const rotation = -15 + (scrollPercent * 30);
                    beam.style.transform = `translateY(${-30 + offset}%) rotate(${rotation}deg)`;
                });
                
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// Phone Parallax on mouse move
function initPhoneParallax() {
    const phoneFrame = document.querySelector('.phone-frame');
    if (!phoneFrame) return;
    
    const heroSection = document.querySelector('.hero');
    
    heroSection?.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        
        const rotateY = x * 15;
        const rotateX = -y * 15;
        
        phoneFrame.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    });
    
    heroSection?.addEventListener('mouseleave', () => {
        phoneFrame.style.transform = 'rotateY(-5deg) rotateX(5deg)';
    });
}

// Mouse Glow Effect
function initMouseGlow() {
    const glow = document.createElement('div');
    glow.className = 'mouse-glow';
    document.body.appendChild(glow);
    
    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function animate() {
        // Smooth follow
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;
        
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        
        requestAnimationFrame(animate);
    }
    animate();
}

// Add dynamic styles
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    .mouse-glow {
        position: fixed;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, 
            rgba(0, 212, 255, 0.08) 0%, 
            rgba(255, 59, 139, 0.05) 30%,
            transparent 70%
        );
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 0;
        transition: opacity 0.3s ease;
    }
    
    @media (max-width: 768px) {
        .mouse-glow {
            display: none;
        }
    }
    
    section {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    section.visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    .step-card,
    .showcase-card,
    .faq-item,
    .feature-col {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .step-card.visible,
    .showcase-card.visible,
    .faq-item.visible,
    .feature-col.visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    .error-message {
        display: block;
        color: #ff3b8b;
        font-size: 0.8125rem;
        margin-top: 0.5rem;
    }
    
    .form-group.has-error input {
        border-color: #ff3b8b !important;
    }
`;
document.head.appendChild(dynamicStyles);

// Expose functions globally
window.scrollToDemo = scrollToDemo;
window.scrollToMechanism = scrollToMechanism;
window.closeDemoPanel = closeDemoPanel;

// Console branding
console.log('%c◆ Lead Agents Studio V3', 'background: linear-gradient(135deg, #00d4ff, #ff3b8b); -webkit-background-clip: text; color: transparent; font-size: 24px; font-weight: bold;');
console.log('%cLight Edition with Animated Lighting', 'color: #86868b; font-size: 14px;');
