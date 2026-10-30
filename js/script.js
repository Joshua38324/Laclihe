document.addEventListener("DOMContentLoaded", function () {
  

  // 1. Control del hash (#) al cargar desde otra página o al recargar
  if (window.location.hash) {
    const perfEntries = performance.getEntriesByType("navigation");
    const isReload = perfEntries.length > 0 && perfEntries[0].type === "reload";

    if (isReload) {
      history.replaceState(null, null, window.location.pathname);
      window.scrollTo(0, 0);
    } else {
      const targetId = window.location.hash.replace('#', '');
      
      setTimeout(() => {
        scrollToTarget(targetId);
      }, 300);
    }
  }

  let isScrolling = false;

  // Función global de desplazamiento e interacción
  const scrollToTarget = (targetId, searchedText = '') => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const headerHeight = document.querySelector("header")?.offsetHeight || 80;
      const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight - 20;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      const card = targetElement.querySelector('.exam-card') || targetElement;
      const categoryTitle = card.querySelector('h3')?.textContent.trim().toLowerCase() || '';
      const cleanSearchText = searchedText.trim().toLowerCase();

      let isSpecificExamMatch = false;

      // Limpia estados de animación previos
      card.classList.remove('highlight-card', 'highlight-card-hover');

      // Si hay texto de búsqueda y no es la especialidad, buscamos el examen específico
      if (cleanSearchText && cleanSearchText !== categoryTitle) {
        const listItems = card.querySelectorAll('.exam-list li');
        listItems.forEach(li => {
          li.classList.remove('highlight-item');
          if (li.textContent.trim().toLowerCase() === cleanSearchText) {
            isSpecificExamMatch = true;
            void li.offsetWidth; // Forzar re-render de CSS
            li.classList.add('highlight-item');
            setTimeout(() => li.classList.remove('highlight-item'), 2500);
          }
        });
      }

      // Aplicación de animaciones diferenciadas
      void card.offsetWidth; // Forzar re-render de la tarjeta
      if (isSpecificExamMatch) {
        // Examen específico: elevación (hover) sin alterar el color de fondo
        card.classList.add('highlight-card-hover');
        setTimeout(() => card.classList.remove('highlight-card-hover'), 2000);
      } else {
        // Tarjeta completa/Especialidad: elevación y tinte de color suave
        card.classList.add('highlight-card');
        setTimeout(() => card.classList.remove('highlight-card'), 2500);
      }
    }
  };

  // 2. Controladores para enlaces del menú y submenú (#)
  const hashLinks = document.querySelectorAll('a[href*="#"]');

  hashLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      const hashIndex = href.indexOf("#");

      if (hashIndex !== -1) {
        const hash = href.substring(hashIndex);
        const targetId = hash.replace('#', '');
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          const currentPath = window.location.pathname.split("/").pop() || "index.html";
          const linkPath = this.pathname.split("/").pop() || "index.html";
          const isSamePage = currentPath === linkPath || href.startsWith("#");

          if (isSamePage) {
            e.preventDefault();

            if (isScrolling) return;
            isScrolling = true;

            const searchInput = document.getElementById('searchExams');
            if (searchInput && searchInput.value !== '') {
              searchInput.value = '';
            }

            const dropdownToggle = this.closest('.dropdown')?.querySelector('.dropdown-toggle');
            if (dropdownToggle) {
              const dropdownInstance = bootstrap.Dropdown.getInstance(dropdownToggle);
              if (dropdownInstance) dropdownInstance.hide();
            }

            const offcanvasEl = document.getElementById("offcanvasMenu");
            if (offcanvasEl) {
              const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
              if (bsOffcanvas) {
                const activeToggler = document.querySelector('[data-bs-target="#offcanvasMenu"]');
                if (activeToggler) activeToggler.blur();
                bsOffcanvas.hide();
              }
            }

            const linkText = this.textContent.trim();
            scrollToTarget(targetId, linkText);
            history.pushState(null, null, hash);

            setTimeout(() => {
              isScrolling = false;
            }, 400);
          }
        }
      }
    });
  });

  // 3. Buscador autocomplete estilo Google y Botón Flotante
  const searchInput = document.getElementById('searchExams');
  const searchResults = document.getElementById('searchResults');
  const btnFloatingSearch = document.getElementById('btnFloatingSearch');

  // Lógica del botón flotante
  if (btnFloatingSearch && searchInput) {
    btnFloatingSearch.addEventListener('click', function () {
      const headerHeight = document.querySelector("header")?.offsetHeight || 80;
      const elementPosition = searchInput.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight - 20;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      setTimeout(() => {
        searchInput.focus();
      }, 400);
    });
  }

  if (searchInput && searchResults) {
    const searchIndex = [];
    const cards = document.querySelectorAll('.exam-card');

    cards.forEach(card => {
      const col = card.closest('[id]');
      const targetId = col ? col.id : null;
      const categoryTitle = card.querySelector('h3')?.textContent.trim() || '';

      if (targetId) {
        searchIndex.push({
          text: categoryTitle,
          category: 'Especialidad',
          targetId: targetId
        });

        const items = card.querySelectorAll('.exam-list li');
        items.forEach(li => {
          searchIndex.push({
            text: li.textContent.trim(),
            category: categoryTitle,
            targetId: targetId
          });
        });
      }
    });

    const normalizeText = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let selectedIndex = -1;

    const hideSuggestions = () => {
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
      selectedIndex = -1;
    };

    const dismissKeyboard = () => {
      searchInput.blur();
    };

    searchInput.addEventListener('focus', function() {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    });

    searchInput.addEventListener('input', function() {
      const query = normalizeText(this.value.trim());

      if (!query) {
        hideSuggestions();
        return;
      }

      const matches = searchIndex.filter(item => normalizeText(item.text).includes(query)).slice(0, 8);

      if (matches.length === 0) {
        searchResults.innerHTML = '<li class="dropdown-item text-muted fs-7 py-2 text-center">No se encontraron exámenes</li>';
        searchResults.style.display = 'block';
        return;
      }

      searchResults.innerHTML = matches.map((item, index) => `
        <li>
          <a class="dropdown-item py-2 px-3 fs-7 d-flex align-items-center justify-content-between text-wrap ${index === 0 ? 'active-suggestion' : ''}" data-index="${index}" data-target="${item.targetId}">
            <div>
              <i class="fas fa-search me-2 text-muted fs-8"></i>
              <span class="suggestion-text">${item.text}</span>
            </div>
            <span class="badge bg-light text-muted fw-normal ms-2 fs-8">${item.category}</span>
          </a>
        </li>
      `).join('');

      searchResults.style.display = 'block';
      selectedIndex = 0;
    });

    searchInput.addEventListener('keydown', function(e) {
      const items = searchResults.querySelectorAll('.dropdown-item');
      if (!items.length || searchResults.style.display === 'none') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectedIndex < items.length - 1) selectedIndex++;
        updateActiveItem(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedIndex > 0) selectedIndex--;
        updateActiveItem(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          dismissKeyboard();
          items[selectedIndex].click();
        }
      } else if (e.key === 'Escape') {
        hideSuggestions();
        dismissKeyboard();
      }
    });

    function updateActiveItem(items) {
      items.forEach((item, index) => {
        if (index === selectedIndex) {
          item.classList.add('active-suggestion');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('active-suggestion');
        }
      });
    }

    searchResults.addEventListener('click', function(e) {
      const item = e.target.closest('.dropdown-item');
      if (item && item.dataset.target) {
        const targetId = item.dataset.target;
        const text = item.querySelector('.suggestion-text')?.textContent.trim() || '';
        if (text) searchInput.value = text;
        
        dismissKeyboard();
        hideSuggestions();
        scrollToTarget(targetId, text);
      }
    });

    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        hideSuggestions();
      }
    });
  }

});
