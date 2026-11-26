const quantity = document.querySelector('#quantity');
const total = document.querySelector('#total');
const receipt = document.querySelector('#receipt');
const record = document.querySelector('#record');
const paymentFields = document.querySelector('fieldset');
const amount = () => `KES ${(Number(quantity.value) + 1) * 65}`;
const resetReceipt = () => {
  receipt.dataset.state = 'ready';
  receipt.textContent = 'Choose a payment method and try a sale.';
};

quantity.addEventListener('change', () => {
  total.textContent = amount();
  resetReceipt();
});
paymentFields.addEventListener('change', resetReceipt);

const allowMotion = window.matchMedia('(prefers-reduced-motion: no-preference)');
if (window.gsap) {
  const media = window.gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    window.gsap.from('.hero-copy, .hero-art', {
      y: 12, opacity: 0.75, duration: 0.55, ease: 'power3.out',
      stagger: 0.07, clearProps: 'opacity,transform',
    });
  });
} else if (allowMotion.matches) {
  document.querySelectorAll('.hero-copy, .hero-art').forEach((element, index) => {
    element.animate([{ transform: 'translateY(12px)', opacity: 0.75 }, { transform: 'none', opacity: 1 }], {
      duration: 550, delay: index * 70, easing: 'cubic-bezier(.23,1,.32,1)',
    });
  });
}
record.addEventListener('click', () => {
  const payment = paymentFields.querySelector('input:checked').value;
  receipt.dataset.state = 'recorded';
  receipt.textContent = `Demo receipt · ${payment} · ${amount()}`;
  if (!allowMotion.matches) return;
  if (window.gsap) {
    window.gsap.fromTo(receipt, { y: 4, opacity: 0.65 }, {
      y: 0, opacity: 1, duration: 0.2, ease: 'power3.out',
      overwrite: 'auto', clearProps: 'opacity,transform',
    });
  } else {
    receipt.animate([{ transform: 'translateY(4px)', opacity: 0.65 }, { transform: 'none', opacity: 1 }], {
      duration: 200, easing: 'cubic-bezier(.23,1,.32,1)',
    });
  }
});
