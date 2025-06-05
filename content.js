(function() {
  const modal = document.createElement('div');
  modal.id = 'picext-modal';
  Object.assign(modal.style, {
    position: 'absolute',
    zIndex: '9999',
    display: 'none',
    border: '1px solid #ccc',
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    padding: '4px',
    pointerEvents: 'none'
  });

  const img = document.createElement('img');
  Object.assign(img.style, {
    width: '400px',
    height: '400px',
    objectFit: 'contain'
  });

  modal.appendChild(img);
  document.documentElement.appendChild(modal);

  function showModal(src, rect) {
    img.src = src;
    modal.style.top = (rect.top + window.scrollY) + 'px';
    modal.style.left = (rect.left + window.scrollX) + 'px';
    modal.style.display = 'block';
  }

  function hideModal() {
    modal.style.display = 'none';
  }

  document.body.addEventListener('mouseover', function(e) {
    const container = e.target.closest('div.index-module__card-img--2QctU');
    if (container) {
      const image = container.querySelector('img');
      if (image) {
        showModal(image.src, container.getBoundingClientRect());
      }
    }
  });

  document.body.addEventListener('mouseout', function(e) {
    const container = e.target.closest('div.index-module__card-img--2QctU');
    if (container && !container.contains(e.relatedTarget)) {
      hideModal();
    }
  });

  document.addEventListener('click', function(e) {
    if (!modal.contains(e.target)) {
      hideModal();
    }
  });
})();
