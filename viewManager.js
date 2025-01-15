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
  }

  createBookElement(book, index) {
    const li = document.createElement("li");
    li.className = "book-item";

    const bookInfo = document.createElement("div");
    bookInfo.className = "book-info";

    const title = document.createElement("span");
    title.className = "book-title";
    title.textContent = book.title;

    const meta = document.createElement("div");
    meta.className = "book-meta";

    if (book.status === "completed") {
      meta.appendChild(this.createDateInput(book, index));
      meta.appendChild(this.createStarRating(book, index));
    }

    bookInfo.appendChild(title);
    if (meta.children.length > 0) {
      bookInfo.appendChild(meta);
    }

    const statusButton = document.createElement("button");
    statusButton.className = "book-status";
    statusButton.setAttribute("data-status", book.status);
    statusButton.textContent = bookManager.getStatusText(book.status);
    statusButton.onclick = () => {
      bookManager.toggleStatus(index);
      this.renderBooks();
    };

    li.appendChild(bookInfo);
    li.appendChild(statusButton);

    if (this.currentView === "panel") {
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
