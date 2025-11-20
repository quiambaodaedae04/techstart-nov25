// Configuration
const MANIFEST_FILE = 'messages/manifest.json';

/**
 * Fetch all JSON files from the messages folder using GitHub API
 */
async function fetchMessages() {
    const loadingEl = document.getElementById('loading');
    const containerEl = document.getElementById('messagesContainer');
    
    loadingEl.classList.add('show');
    containerEl.innerHTML = '';

    // // Get JSON files in /messages (local, static) for testing
    // const messageFiles = [
    //     "messages/example.json",
    //     "messages/techstart-team.json"
    // ];

    // // use messageFiles to fetch the messages
    // const messages = [];
    // for (let i = 0; i < messageFiles.length; i++) {
    //     const req = new XMLHttpRequest();
    //     req.open('GET', messageFiles[i], false); // synchronous request
    //     req.send(null);
    //     if (req.status === 200) {
    //         messages.push(JSON.parse(req.responseText));
    //     }
    // }
    
    // displayMessages(messages, containerEl);
    // loadingEl.classList.remove('show');

    // return;

    try {
        // Fetch manifest directly as a local file
        const manifestResponse = await fetch(MANIFEST_FILE);

        if (!manifestResponse.ok) {
            if (manifestResponse.status === 404) {
                throw new Error('Manifest not found. Run the manifest update script to generate it.');
            }
            throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`);
        }

        const manifestData = await manifestResponse.json();
        const messages = Array.isArray(manifestData.messages) ? manifestData.messages : [];
        console.log(`Loaded ${messages.length} messages from manifest`);
        
        if (messages.length === 0) {
            showEmptyState(containerEl);
            loadingEl.classList.remove('show');
            return;
        }

        // Messages are already embedded in the manifest, no need for additional API calls
        // Just ensure each message has the filename and lastModified fields
        const validMessages = messages.map(msg => ({
            ...msg,
            lastModified: msg.filename || 'unknown' // Use filename as identifier
        }));
        
        // Sort messages (newest first if timestamp exists, otherwise by filename)
        validMessages.sort((a, b) => {
            if (a.timestamp && b.timestamp) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            return a.filename.localeCompare(b.filename);
        });

        displayMessages(validMessages, containerEl);
        loadingEl.classList.remove('show');

    } catch (error) {
        console.error('Error fetching messages:', error);
        showErrorState(containerEl, error.message);
        loadingEl.classList.remove('show');
    }
}

/**
 * Display messages in the container
 */
function displayMessages(messages, containerEl) {
    if (messages.length === 0) {
        showEmptyState(containerEl);
        return;
    }

    containerEl.innerHTML = messages.map(message => createMessageCard(message)).join('');
}

/**
 * Create HTML for a message card
 */
function createMessageCard(message) {
    const author = message.author || message.name || 'Anonymous';
    const content = message.message || message.content || message.text || 'No message provided';
    const timestamp = message.timestamp ? formatDate(message.timestamp) : '';

    return `
        <div class="message-card">
            <div class="message-content">${escapeHtml(content)}</div>
            <div class="message-footer">
                <span>${escapeHtml(author)}</span>
            </div>
        </div>
    `;
}

/**
 * Show empty state when no messages are found
 */
function showEmptyState(containerEl) {
    containerEl.innerHTML = `
        <div class="empty-state">
            <h2>No messages yet!</h2>
            <p>Be the first to contribute by adding your message file to the messages folder.</p>
        </div>
    `;
}

/**
 * Show error state when something goes wrong
 */
function showErrorState(containerEl, errorMessage) {
    containerEl.innerHTML = `
        <div class="error-state">
            <h2>⚠️ Error loading messages</h2>
            <p>${escapeHtml(errorMessage)}</p>
            <p style="margin-top: 10px;">Make sure the manifest.json file exists in the messages folder.</p>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchMessages();
    
    // Optional: Refresh messages every 5 minutes
    setInterval(fetchMessages, 5 * 60 * 1000);
});

