document.addEventListener('DOMContentLoaded', () => {
    console.log('Los Fintz Productions site loaded.');

    // Mobile Navigation Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    const setMenuOpen = (open) => {
        navLinks.classList.toggle('active', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        menuToggle.innerHTML = open ? '✕' : '☰';
    };
    if (menuToggle && navLinks) {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            setMenuOpen(!navLinks.classList.contains('active'));
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navLinks.classList.contains('active')) {
                setMenuOpen(false);
                menuToggle.focus();
            }
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) setMenuOpen(false);
        });
    }
    const closeMobileMenu = () => {
        if (menuToggle && navLinks) setMenuOpen(false);
    };

    // Close mobile menu on non-dropdown links or dropdown item links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            const isDropdownParent = link.parentElement.classList.contains('dropdown');
            if (window.innerWidth <= 768) {
                if (!isDropdownParent) {
                    closeMobileMenu();
                }
            }
        });
    });

    // Mobile Dropdown Submenus Toggle
    document.querySelectorAll('.dropdown > a').forEach(el => {
        el.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const parent = el.parentElement;
                parent.classList.toggle('open');
                el.setAttribute('aria-expanded', String(parent.classList.contains('open')));
            }
        });
    });

    // Close mobile menu on tap outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && navLinks && navLinks.classList.contains('active')) {
            const isInsideNavbar = e.target.closest('.navbar');
            if (!isInsideNavbar) {
                closeMobileMenu();
            }
        }
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
        observer.observe(el);
    });
});
