class LinkPreview {
    constructor() {

        // Disable on mobile
        if (window.innerWidth < 768) return;

        // Create the popover element
        this.popover = document.createElement('div');
        this.popover.classList.add('popover');
        this.popover.style.cssText = `
        position: fixed;
        border: 1px solid #ddd;
        display: none;
        width: 400px;
        max-height: 100vh;
        z-index: 99999;
        user-select: none;
        -webkit-user-select: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        pointer-events: none;
        `;

        // Create content container
        this.content = document.createElement('div');
        this.content.style.cssText = `
        height: auto;
        max-height: calc(500px - 30px);
        overflow-y: auto;
        font-size: 14px;
        color: #333;
        padding: 1rem;
        background: #faf5f2;
        pointer-events: auto;
        `;

        // Create drag handle
        this.dragHandle = document.createElement('div');
        this.dragHandle.style.cssText = `
        height: 30px;
        background: #f3f4f6;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        padding: 0 70px 0 8px;
        font-size: 12px;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        pointer-events: auto;
        `;

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
        position: absolute;
        background: #f3f4f6;
        top: 0;
        right: 0;
        height: 30px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 3;
        padding: 0 5px 0 15px;
        pointer-events: auto;
        `;

        // Create pin button with wrapper for better click handling
        const pinWrapper = document.createElement('div');
        pinWrapper.style.cssText = `
        width: 20px;
        height: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        `;
        this.pinButton = document.createElement('div');
        this.pinButton.style.cssText = `
        color: #323232;
        line-height: 0;
        border-radius: 3px;
        `;
        this.pinButton.innerHTML = `
        <svg version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;">
        <g stroke-linecap="round" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linejoin="round">
        <path d="M3.5 20l4.37-4.37"></path>
        <path d="M4.956 11.294c-.391.391-.391 1.024 0 1.414l2.918 2.918 2.918 2.918c.391.391 1.024.391 1.414 0l1.175-1.175c.188-.188.293-.442.293-.707v-3.936l2.9-2.9 2.309.123c.283.015.56-.091.76-.291l.574-.574c.391-.391.391-1.024 0-1.414l-4.386-4.386c-.391-.391-1.024-.391-1.414 0l-.574.574c-.201.201-.307.477-.291.76l.123 2.309 -2.9 2.9h-3.937c-.265 0-.52.105-.707.293l-1.175 1.174Z"></path>
        <path d="M16.57 9.83l-2.9-2.9"></path>
        </g>
        </svg>
        `;
        pinWrapper.appendChild(this.pinButton);
        pinWrapper.addEventListener('click', () => this.togglePin());
        pinWrapper.title = 'Pin preview';

        // Create close button with wrapper
        const closeWrapper = document.createElement('div');
        closeWrapper.style.cssText = `
        width: 20px;
        height: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        `;
        const closeButton = document.createElement('div');
        closeButton.style.cssText = `
        color: #323232;
        line-height: 0;
        `;
        closeButton.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;">
        <line x1="5.75" y1="5.75" x2="18.25" y2="18.25" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
        <line x1="5.75" y1="18.25" x2="18.25" y2="5.75" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
        </svg>
        `;
        closeWrapper.appendChild(closeButton);
        closeWrapper.addEventListener('click', () => {
            this.popover.style.display = 'none';
            this.activeLink = null;
            this.isPinned = false;
            this.pinButton.style.color = '#323232';
        });

        // Add buttons to container
        buttonContainer.appendChild(pinWrapper);
        buttonContainer.appendChild(closeWrapper);

        this.isHovering = false;

        // Assemble the elements
        this.popover.appendChild(this.dragHandle);
        this.popover.appendChild(buttonContainer);
        this.popover.appendChild(this.content);
        document.body.appendChild(this.popover);

        // Initialize variables
        this.activeLink = null;
        this.hideTimeout = null;
        this.loadedContent = new Map();
        this.isDragging = false;
        this.currentX = 0;
        this.currentY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.xOffset = 0;
        this.yOffset = 0;

        // Setup events
        this.setupEventListeners();
        this.dragHandle.addEventListener('mousedown', (e) => this.dragStart(e));
    }

    updateTitle(title) {
        this.dragHandle.textContent = title;
    }

    setupEventListeners() {
        const handleMousePosition = (e) => {
            const link = e.target.closest('a');
            const isOverPopover = e.target.closest('.popover') === this.popover;

            if (!link && !isOverPopover) {
                if (!this.isHovering) {
                    this.scheduleHide();
                }
            } else {
                clearTimeout(this.hideTimeout);

                if (link && !e.target.closest('.popover')) {
                    if (link !== this.activeLink && link.href && !link.href.startsWith('javascript:')) {
                        this.showPreview(link);
                    }
                }
            }
        };

        // Add mouseover/mouseout handlers
        document.addEventListener('mouseover', handleMousePosition);
        document.addEventListener('mouseout', handleMousePosition);

        // Add sidenote-specific handlers
        document.addEventListener('mouseover', (e) => {
            const sidenote = e.target.closest('.sidenote, .sidenote-inline');
            if (sidenote) {
                // Enable sidenote interaction
                this.popover.style.pointerEvents = 'none';
                sidenote.style.zIndex = '100';
            }
        });

        document.addEventListener('mouseout', (e) => {
            const sidenote = e.target.closest('.sidenote, .sidenote-inline');
            if (sidenote) {
                // Restore normal popover behavior
                this.popover.style.pointerEvents = 'auto';
                sidenote.style.zIndex = '';
            }
        });

        // Popover hover handling
        this.popover.addEventListener('mouseenter', () => {
            clearTimeout(this.hideTimeout);
            this.isHovering = true;
        });

        this.popover.addEventListener('mouseleave', () => {
            this.isHovering = false;
            if (!this.isDragging && !this.isPinned) {
                this.scheduleHide();
            }
        });

        // Drag handling
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.dragEnd());

        window.addEventListener('scroll', () => {
            if (!this.isDragging) {
                this.updatePosition();
            }
        });

        window.addEventListener('resize', () => {
            if (!this.isDragging) {
                this.updatePosition();
            }
        });
    }

    async loadContent(url) {
        if (this.loadedContent.has(url)) {
            return this.loadedContent.get(url);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const urlObj = new URL(url);
            const sectionId = urlObj.hash.slice(1); // Remove the # from the hash

            let mainContent;
            let title = doc.querySelector('title')?.textContent || new URL(url).pathname;

            // If there's a hash in the URL, try to find that section
            if (sectionId) {
                // Find the target section by id
                const targetSection = doc.getElementById(sectionId);

                if (targetSection) {
                    mainContent = document.createElement('div');
                    mainContent.appendChild(targetSection.cloneNode(true));

                    // Add subsequent elements until we hit the next section heading
                    let nextElement = targetSection.nextElementSibling;
                    while (nextElement) {
                        // Stop if we hit another heading of the same level or higher
                        if (nextElement.tagName?.[0] === 'H') {
                            const targetHeadingLevel = targetSection.querySelector('h1, h2, h3, h4, h5, h6')?.tagName[1] || '1';
                            const nextHeadingLevel = nextElement.tagName[1];
                            if (nextHeadingLevel <= targetHeadingLevel) {
                                break;
                            }
                        }
                        mainContent.appendChild(nextElement.cloneNode(true));
                        nextElement = nextElement.nextElementSibling;
                    }

                    // Update title if we found a heading in the section
                    const sectionHeading = targetSection.querySelector('h1, h2, h3, h4, h5, h6')?.textContent;
                    if (sectionHeading) {
                        title = `${sectionHeading} - ${title}`;
                    }
                }
            }

            // If no section found or no hash, fall back to main content
            if (!mainContent) {
                mainContent = doc.querySelector('main') ||
                doc.querySelector('article') ||
                doc.querySelector('.content') ||
                doc.querySelector('.main-content') ||
                doc.querySelector('.entry-content') ||
                doc.querySelector('#content') ||
                doc.body;
            }

            if (!mainContent) {
                throw new Error('No content found');
            }

            const processedContent = this.processContent(mainContent);

            const result = { content: processedContent, title: title };
            this.loadedContent.set(url, result);

            return result;

        } catch (error) {
            console.error('Preview loading error:', error);
            console.error('URL attempted:', url);
            return {
                content: `
                <div style="color: #ef4444; text-align: center; padding: 20px;">
                Failed to load preview<br>
                <small style="color: #666;">${error.message}</small>
                </div>
                `,
                title: 'Error Loading Preview'
            };
        }
    }

    processContent(content) {
        const processed = content.cloneNode(true);

        // Remove potentially problematic elements
        const removeSelectors = [
            'script',
            'iframe',
            'form',
            'input',
            'button',
            'video',
            'audio',
            'header',
            'footer',
            '.sidenote',
            '.jump-to-top'
        ];
        removeSelectors.forEach(selector => {
            processed.querySelectorAll(selector).forEach(el => el.remove());
        });

        // Handle links - disable hover effects, keep click functionality
        processed.querySelectorAll('a').forEach(link => {
            // Only handle actual URLs, not javascript: links
            if (link.href && !link.href.startsWith('javascript:')) {
                link.style.pointerEvents = 'none';  // Disable hover effects
                // Wrap link in clickable span to maintain click functionality
                const wrapper = document.createElement('span');
                wrapper.style.cursor = 'pointer';
                wrapper.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.open(link.href, '_blank', 'noopener');
                });
                link.parentNode.insertBefore(wrapper, link);
                wrapper.appendChild(link);
            } else {
                // For javascript: links or invalid hrefs, just disable them completely
                link.style.pointerEvents = 'none';
                link.style.cursor = 'text';
            }
        });

        // Handle images - keep them full width despite padding
        processed.querySelectorAll('img').forEach(img => {
            if (img.src.startsWith('/')) {
                img.src = new URL(img.src, window.location.origin).href;
            }
            img.style.cssText = `
            max-width: calc(100% + 2rem);
            height: auto;
            margin-left: -1rem;
            margin-right: -1rem;
            display: block;
            `;
        });

        return processed.innerHTML;
    }

    async showPreview(link) {
        if (this.activeLink === link) return;

        this.activeLink = link;
        this.content.innerHTML = '<div style="text-align: center; padding: 20px;">Loading preview...</div>';
        this.updateTitle('Loading...');
        this.popover.style.display = 'block';

        // Don't reset transform if it's pinned
        if (!this.isPinned) {
            this.xOffset = 0;
            this.yOffset = 0;
            this.popover.style.transform = '';
        }

        this.updatePosition();

        try {
            const result = await this.loadContent(link.href);
            if (this.activeLink === link) {
                this.content.innerHTML = result.content;
                this.updateTitle(result.title);
                this.updatePosition();
            }
        } catch (error) {
            console.error('Preview failed:', error);
            if (this.activeLink === link) {
                this.content.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                <div style="color: #ef4444;">Unable to load preview</div>
                <div style="color: #666; font-size: 0.9em; margin-top: 8px;">
                ${error.message}
                </div>
                </div>
                `;
                this.updateTitle('Error');
            }
        }
    }

    updatePosition() {
        if (!this.activeLink || this.popover.style.display === 'none') return;

        // Don't update position if dragged/pinned
        if (this.isPinned || this.xOffset !== 0 || this.yOffset !== 0) return;

        const linkRect = this.activeLink.getBoundingClientRect();
        const popoverWidth = 400;
        const margin = 10;

        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Get current scroll position
        const scrollY = window.scrollY;

        // Calculate available space in different directions
        const spaceRight = viewportWidth - linkRect.right - margin;
        const spaceLeft = linkRect.left - margin;
        const spaceBelow = viewportHeight - linkRect.bottom - margin;
        const spaceAbove = linkRect.top - margin;

        let left, top;

        // Determine horizontal position
        if (spaceRight >= popoverWidth) {
            // Prefer right side if there's space
            left = linkRect.right + margin;
        } else if (spaceLeft >= popoverWidth) {
            // Fall back to left side if there's space
            left = linkRect.left - popoverWidth - margin;
        } else {
            // Center horizontally if neither side has enough space
            left = Math.max(margin, Math.min(
                viewportWidth - popoverWidth - margin,
                (viewportWidth - popoverWidth) / 2
            ));
        }

        // Determine vertical position
        // First try to align with the link's top
        top = linkRect.top;

        // Check if the popover extends beyond viewport bottom
        const popoverHeight = this.popover.offsetHeight;
        const bottomOverflow = top + popoverHeight - (viewportHeight + scrollY);

        if (bottomOverflow > 0) {
            // If it extends beyond bottom, try to move it up
            top = Math.max(
                scrollY + margin, // Don't go above viewport
                top - bottomOverflow // Move up by the overflow amount
            );
        }

        // Apply final position
        this.popover.style.left = `${left}px`;
        this.popover.style.top = `${top}px`;
    }

    scheduleHide() {
        if (this.isPinned || this.isHovering) return;
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            this.popover.style.display = 'none';
            this.activeLink = null;
        }, 100);
    }

    dragStart(e) {
        this.initialX = e.clientX - this.xOffset;
        this.initialY = e.clientY - this.yOffset;

        if (e.target === e.currentTarget) {
            this.isDragging = true;
        }
    }

    drag(e) {
        if (this.isDragging) {
            e.preventDefault();

            this.currentX = e.clientX - this.initialX;
            this.currentY = e.clientY - this.initialY;

            this.xOffset = this.currentX;
            this.yOffset = this.currentY;

            this.setTranslate(this.currentX, this.currentY);
        }
    }

    dragEnd() {
        this.isDragging = false;
        if (!this.isPinned && (this.xOffset !== 0 || this.yOffset !== 0)) {
            this.togglePin();
        }
    }

    setTranslate(xPos, yPos) {
        this.popover.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    togglePin() {
        this.isPinned = !this.isPinned;
        this.pinButton.style.background = this.isPinned ? '#ccc' : '#f3f4f6';
        this.pinButton.style.color = this.isPinned ? '#1a365d' : '#666';
        this.pinButton.title = this.isPinned ? 'Unpin preview' : 'Pin preview';
    }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LinkPreview();
});
