// Book management and operations
class BookManager {
    constructor() {
        this.books = JSON.parse(localStorage.getItem('books')) || [];
    }

    addBook(title) {
        if (title.trim()) {
            this.books.push({
                title: title,
                status: 'unread'
            });
            this.saveBooks();
            return true;
        }
        return false;
    }

    toggleStatus(index) {
        const statusOrder = ['unread', 'reading', 'completed'];
        const currentStatus = this.books[index].status;
        const currentIndex = statusOrder.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        const newStatus = statusOrder[nextIndex];
        
        this.books[index].status = newStatus;
        
        if (newStatus === 'completed') {
            this.books[index].completedDate = new Date().toISOString();
        } else {
            delete this.books[index].completedDate;
            delete this.books[index].rating;
        }
        
        this.saveBooks();
    }

    updateBookStatus(index, newStatus) {
        if (newStatus === 'completed') {
            this.books[index].completedDate = this.books[index].completedDate || new Date().toISOString();
        } else if (this.books[index].status === 'completed') {
            delete this.books[index].completedDate;
            delete this.books[index].rating;
        }
        
        this.books[index].status = newStatus;
        this.saveBooks();
    }

    updateBookRating(index, rating) {
        this.books[index].rating = rating;
        this.saveBooks();
    }

    updateCompletionDate(index, date) {
        this.books[index].completedDate = new Date(date).toISOString();
        this.saveBooks();
    }

    getStats() {
        return this.books.reduce((acc, book) => {
            acc[book.status]++;
            return acc;
        }, {
            unread: 0,
            reading: 0,
            completed: 0
        });
    }

    saveBooks() {
        localStorage.setItem('books', JSON.stringify(this.books));
    }

    getStatusText(status) {
        const statusTexts = {
            'unread': 'Oläst',
            'reading': 'Läser',
            'completed': 'Klar'
        };
        return statusTexts[status];
    }
}

export const bookManager = new BookManager();
