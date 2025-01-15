import { bookManager } from "./bookManager.js";

class ViewManager {
  constructor() {
    this.currentView = localStorage.getItem("currentView") || "list";
    this.draggedBook = null;
    this.initializeViewButtons();
    this.initializeAddBookHandlers();
  }

  initializeViewButtons() {
    document.querySelectorAll(".view-button").forEach((button) => {
      button.addEventListener("click", () =>
        this.updateView(button.dataset.view)
      );
    });
  }

  initializeAddBookHandlers() {
    document.getElementById("bookInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleAddBook();
      }
    });
  }

  updateView(view) {
    this.currentView = view;
    localStorage.setItem("currentView", view);

    document.querySelectorAll(".view-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === view);
    });

    document
      .querySelector(".list-view")
      .classList.toggle("active", view === "list");
    document
      .querySelector(".panel-view")
      .classList.toggle("active", view === "panel");

    this.renderBooks();
  }

  handleAddBook() {
    const input = document.getElementById("bookInput");
    const title = input.value.trim();

    if (bookManager.addBook(title)) {
      input.value = "";
      this.renderBooks();
    }
  }

  updateStats() {
    const stats = bookManager.getStats();
    document.getElementById("unreadCount").textContent = stats.unread;
    document.getElementById("readingCount").textContent = stats.reading;
    document.getElementById("completedCount").textContent = stats.completed;
  }

  formatDateForInput(date) {
    return new Date(date).toISOString().split("T")[0];
  }

  createStarRating(book, index) {
    const container = document.createElement("div");
    container.className = "star-rating";

    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.className = "star" + (i <= (book.rating || 0) ? " filled" : "");
      star.textContent = "★";
      star.onclick = (e) => {
        e.stopPropagation();
        bookManager.updateBookRating(index, i);
        this.renderBooks();
      };
      container.appendChild(star);
    }

    return container;
  }

  createDateInput(book, index) {
    const container = document.createElement("div");
    container.className = "completion-date";

    const label = document.createElement("label");
    label.textContent = "Läst:";

    const input = document.createElement("input");
    input.type = "date";
    input.value = this.formatDateForInput(book.completedDate || new Date());
    input.onchange = (e) => {
      bookManager.updateCompletionDate(index, e.target.value);
      this.renderBooks();
    };

    container.appendChild(label);
    container.appendChild(input);
    return container;
  }

  addDragHandlers(element, book, index) {
    element.draggable = true;
    let touchTimeout;
    let startX, startY;
    let clone = null;

    // Mouse drag events
    element.addEventListener("dragstart", (e) => {
      this.draggedBook = { book, index };
      element.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    element.addEventListener("dragend", () => {
      element.classList.remove("dragging");
      document.querySelectorAll(".panel").forEach((panel) => {
        panel.classList.remove("drag-over");
      });
    });

    // Touch events
    element.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;

      touchTimeout = setTimeout(() => {
        this.draggedBook = { book, index };
        element.classList.add("dragging");
        
        // Create visual feedback clone
        clone = element.cloneNode(true);
        clone.style.position = "fixed";
        clone.style.left = startX - element.offsetWidth / 2 + "px";
        clone.style.top = startY - element.offsetHeight / 2 + "px";
        clone.style.opacity = "0.8";
        clone.style.pointerEvents = "none";
        document.body.appendChild(clone);
      }, 200);
    }, { passive: false });

    element.addEventListener("touchmove", (e) => {
      if (!this.draggedBook || !clone) return;
      e.preventDefault();

      const touch = e.touches[0];
      clone.style.left = touch.clientX - element.offsetWidth / 2 + "px";
      clone.style.top = touch.clientY - element.offsetHeight / 2 + "px";

      // Find panel under touch point
      const panels = document.querySelectorAll(".panel");
      panels.forEach(panel => panel.classList.remove("drag-over"));
      
      const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
      const panel = elementAtPoint?.closest(".panel");
      if (panel) {
        panel.classList.add("drag-over");
      }
    }, { passive: false });

    element.addEventListener("touchend", (e) => {
      clearTimeout(touchTimeout);
      if (!this.draggedBook) return;

      const touch = e.changedTouches[0];
      const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
      const panel = elementAtPoint?.closest(".panel");

      if (panel) {
        const newStatus = panel.dataset.status;
        const { index } = this.draggedBook;
        bookManager.updateBookStatus(index, newStatus);
      }

      if (clone) {
        clone.remove();
        clone = null;
      }

      element.classList.remove("dragging");
      document.querySelectorAll(".panel").forEach((panel) => {
        panel.classList.remove("drag-over");
      });
      this.draggedBook = null;
      this.renderBooks();
    });

    element.addEventListener("touchcancel", () => {
      clearTimeout(touchTimeout);
      if (clone) {
        clone.remove();
        clone = null;
      }
      element.classList.remove("dragging");
      document.querySelectorAll(".panel").forEach((panel) => {
        panel.classList.remove("drag-over");
      });
      this.draggedBook = null;
    });
  }

    createBookTitle(book, index, container) {
        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'book-title';
        titleWrapper.dataset.editing = 'false';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = book.title;
        titleWrapper.appendChild(titleSpan);

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'book-title-edit';
        titleInput.value = book.title;
        titleInput.style.display = 'none';
        titleWrapper.appendChild(titleInput);

        container.appendChild(titleWrapper);
        return { titleWrapper, titleInput };
    }

    createBookActions(book, index, titleElements) {
        const actions = document.createElement('div');
        actions.className = 'book-actions';

        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.innerHTML = '✎';
        editButton.title = 'Ändra titel';
        editButton.onclick = (e) => {
            e.stopPropagation();
            const { titleWrapper, titleInput } = titleElements;
            const isEditing = titleWrapper.dataset.editing === 'true';

            if (isEditing) {
                if (bookManager.updateBookTitle(index, titleInput.value)) {
                    titleWrapper.dataset.editing = 'false';
                    titleInput.style.display = 'none';
                    titleWrapper.querySelector('span').style.display = 'block';
                    editButton.innerHTML = '✎';
                    this.renderBooks();
                }
            } else {
                titleWrapper.dataset.editing = 'true';
                titleInput.style.display = 'block';
                titleWrapper.querySelector('span').style.display = 'none';
                titleInput.focus();
                editButton.innerHTML = '✓';
            }
        };

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = '🗑';
        deleteButton.title = 'Ta bort bok';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            if (confirm('Är du säker på att du vill ta bort boken?')) {
                bookManager.deleteBook(index);
                this.renderBooks();
            }
        };

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        return actions;
    }

    createBookElement(book, index) {
        const li = document.createElement('li');
        li.className = 'book-item';
        
        const bookInfo = document.createElement('div');
        bookInfo.className = 'book-info';
        
        const titleElements = this.createBookTitle(book, index, bookInfo);
        
        const meta = document.createElement('div');
        meta.className = 'book-meta';
        
        if (book.status === 'completed') {
            meta.appendChild(this.createDateInput(book, index));
            meta.appendChild(this.createStarRating(book, index));
        }
        
        if (meta.children.length > 0) {
            bookInfo.appendChild(meta);
        }
        
        const statusButton = document.createElement('button');
        statusButton.className = 'book-status';
        statusButton.setAttribute('data-status', book.status);
        statusButton.textContent = bookManager.getStatusText(book.status);
        statusButton.onclick = () => {
            bookManager.toggleStatus(index);
            this.renderBooks();
        };
        
        const actions = this.createBookActions(book, index, titleElements);
        
        li.appendChild(bookInfo);
        li.appendChild(actions);
        li.appendChild(statusButton);

        if (this.currentView === 'panel') {
            this.addDragHandlers(li, book, index);
        }
        
        return li;
  }

  initializePanelDragAndDrop() {
    document.querySelectorAll(".panel").forEach((panel) => {
      panel.addEventListener("dragover", (e) => {
        e.preventDefault();
        panel.classList.add("drag-over");
      });

      panel.addEventListener("dragleave", () => {
        panel.classList.remove("drag-over");
      });

      panel.addEventListener("drop", (e) => {
        e.preventDefault();
        panel.classList.remove("drag-over");

        if (this.draggedBook) {
          const newStatus = panel.dataset.status;
          const { index } = this.draggedBook;

          bookManager.updateBookStatus(index, newStatus);
          this.draggedBook = null;
          this.renderBooks();
        }
      });
    });
  }

  renderBooks() {
    if (this.currentView === "list") {
      const bookList = document.getElementById("bookList");
      bookList.innerHTML = "";
      bookManager.books.forEach((book, index) => {
        bookList.appendChild(this.createBookElement(book, index));
      });
    } else {
      document.querySelectorAll(".panel-books").forEach((panel) => {
        panel.innerHTML = "";
      });

      bookManager.books.forEach((book, index) => {
        const panel = document.querySelector(
          `.panel[data-status="${book.status}"] .panel-books`
        );
        panel.appendChild(this.createBookElement(book, index));
      });

      this.initializePanelDragAndDrop();
    }

    this.updateStats();
  }
}

export const viewManager = new ViewManager();
