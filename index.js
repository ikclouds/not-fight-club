document.addEventListener('DOMContentLoaded', function() {
  // Burger menu
  const burgerMenu = document.querySelector('.navigation__burger');
  const menu = document.querySelector('.navigation__menu');
  const overlay = document.querySelector('.page__overlay');
  const menuLinks = document.querySelectorAll('.navigation__link');
  const activeItemDisplay = document.querySelector('.navigation__active-item');
  const fightLink = document.querySelector('.fight-link');
 
  // Toggle burger menu
  burgerMenu.addEventListener('click', function() {
    this.classList.toggle('navigation_burger_active');
    menu.classList.toggle('navigation_menu_active');
    overlay.classList.toggle('page_overlay_active');
  });

// Close menu when clicking outside
  overlay.addEventListener('click', function() {
    burgerMenu.classList.remove('navigation_burger_active');
    menu.classList.remove('navigation_menu_active');
    overlay.classList.remove('page_overlay_active');

    // Also close any open forms when clicking overlay
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.remove('active');
    });
  });

  // Smooth scrolling for menu items
  menuLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Close the menu
        burgerMenu.classList.remove('navigation_burger_active');
        menu.classList.remove('navigation_menu_active');
        overlay.classList.remove('page_overlay_active');

        // Update active menu item display
        const linkText = this.textContent;
        if (linkText !== 'Login' && linkText !== 'Logout') {
            activeItemDisplay.textContent = linkText;
            sessionStorage.setItem('nftActiveMenuItem', linkText);
        }
    });
  });
});