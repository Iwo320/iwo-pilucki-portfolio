const burger = document.querySelector('.burger');
const mobileMenu = document.querySelector('.mobile-menu');

burger?.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
});

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
    burger?.setAttribute('aria-label', 'Open menu');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

document.addEventListener('click', (event) => {
  if (
    mobileMenu.classList.contains('open') &&
    !mobileMenu.contains(event.target) &&
    !burger?.contains(event.target)
  ) {
    mobileMenu.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
    burger?.setAttribute('aria-label', 'Open menu');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }
});