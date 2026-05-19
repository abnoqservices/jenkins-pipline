/**
 * Landing Page Analytics Tracker
 * 
 * This script automatically tracks page views, engagement metrics, and user interactions
 * on product landing pages. Include this script in your landing page HTML.
 * 
 * Usage:
 * <script src="/landing-page-tracker.js"></script>
 * <script>
 *   const tracker = new LandingPageTracker({
 *     productId: 123,
 *     eventId: 456,
 *     boothId: 789,
 *     apiBaseUrl: 'https://your-api-domain.com/api'
 *   });
 * </script>
 */

class LandingPageTracker {
    constructor(options = {}) {
        this.productId = options.productId;
        this.eventId = options.eventId || null;
        this.boothId = options.boothId || null;
        this.apiBaseUrl = options.apiBaseUrl || '/api';
        
        this.sessionStartTime = Date.now();
        this.maxScroll = 0;
        this.pageViewTracked = false;
        this.engagementUpdateInterval = null;
        this.scrollCheckpoints = [25, 50, 75, 100];
        this.scrollCheckpointsReached = new Set();
        
        this.init();
    }
    
    init() {
        // Track page view immediately
        this.trackPageView();
        
        // Track button clicks
        this.trackButtonClicks();
        
        // Track scroll depth
        this.trackScrollDepth();
        
        // Track video plays
        this.trackVideoPlays();
        
        // Track form views
        this.trackFormViews();
        
        // Send engagement updates periodically
        this.startEngagementTracking();
        
        // Track time on page and final engagement on exit
        this.trackOnExit();
    }
    
    /**
     * Track page view
     */
    trackPageView() {
        if (this.pageViewTracked) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const utmParams = this.extractUTMParams();
        
        this.track('page_view', {
            url: window.location.href,
            ...utmParams,
        });
        
        this.pageViewTracked = true;
    }
    
    /**
     * Track button/CTA clicks
     */
    trackButtonClicks() {
        // Track all buttons with data-track attribute
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-track], button, a[href]');
            if (!button) return;
            
            const trackValue = button.getAttribute('data-track');
            const buttonText = button.textContent?.trim() || button.getAttribute('aria-label') || 'unknown';
            const buttonId = button.id || button.getAttribute('data-id') || null;
            
            // Determine event type
            let eventType = 'button_click';
            if (button.tagName === 'A' || button.closest('a')) {
                eventType = 'link_click';
            } else if (button.classList.contains('cta') || button.getAttribute('data-cta') === 'true') {
                eventType = 'cta_click';
            }
            
            this.track(eventType, {
                field_key: trackValue || buttonId || buttonText,
                button_text: buttonText,
                button_id: buttonId,
                href: button.href || null,
            });
        });
    }
    
    /**
     * Track scroll depth
     */
    trackScrollDepth() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateScrollDepth();
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // Check scroll depth on load
        this.updateScrollDepth();
    }
    
    updateScrollDepth() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollableHeight = documentHeight - windowHeight;
        
        if (scrollableHeight <= 0) {
            this.maxScroll = 100;
            this.sendEngagementUpdate();
            return;
        }
        
        const scrollPercentage = Math.round((scrollTop / scrollableHeight) * 100);
        this.maxScroll = Math.max(this.maxScroll, scrollPercentage);
        
        // Check if we've reached any new checkpoint
        this.scrollCheckpoints.forEach(checkpoint => {
            if (scrollPercentage >= checkpoint && !this.scrollCheckpointsReached.has(checkpoint)) {
                this.scrollCheckpointsReached.add(checkpoint);
                this.sendEngagementUpdate();
            }
        });
    }
    
    /**
     * Track video plays
     */
    trackVideoPlays() {
        document.querySelectorAll('video').forEach(video => {
            video.addEventListener('play', () => {
                this.track('video_play', {
                    field_key: video.id || video.getAttribute('data-id') || 'video',
                    video_src: video.src || video.currentSrc,
                });
            });
        });
    }
    
    /**
     * Track form views
     */
    trackFormViews() {
        document.querySelectorAll('form').forEach(form => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.track('form_view', {
                            field_key: form.id || form.getAttribute('data-form-id') || 'form',
                        });
                        observer.unobserve(form);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(form);
        });
    }
    
    /**
     * Start periodic engagement tracking
     */
    startEngagementTracking() {
        // Send engagement update every 10 seconds
        this.engagementUpdateInterval = setInterval(() => {
            this.sendEngagementUpdate();
        }, 10000);
    }
    
    /**
     * Send engagement update (time on page, scroll depth)
     */
    sendEngagementUpdate() {
        // Only track if we have a valid product_id
        if (!this.productId || this.productId === 'null' || this.productId === null) {
            return; // Silently skip tracking if no product_id
        }
        
        const timeOnPage = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        
        fetch(`${this.apiBaseUrl}/public/analytics/track-engagement`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: this.productId,
                event_id: this.eventId,
                booth_id: this.boothId,
                session_id: this.getSessionId(),
                time_on_page: timeOnPage,
                scroll_depth: this.maxScroll,
                country_code:2
            }),
        }).catch(err => {
            console.warn('Failed to track engagement:', err);
        });
    }
    
    /**
     * Track on page exit
     */
    trackOnExit() {
        // Track on page unload
        window.addEventListener('beforeunload', () => {
            this.sendEngagementUpdate();
            
            // Use sendBeacon for reliable tracking on page unload
            const timeOnPage = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            const data = JSON.stringify({
                product_id: this.productId,
                event_id: this.eventId,
                booth_id: this.boothId,
                session_id: this.getSessionId(),
                time_on_page: timeOnPage,
                scroll_depth: this.maxScroll,
            });
            
            navigator.sendBeacon(
                `${this.apiBaseUrl}/public/analytics/track-engagement`,
                new Blob([data], { type: 'application/json' })
            );
        });
        
        // Also track on visibility change (tab switch)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.sendEngagementUpdate();
            }
        });
    }
    
    /**
     * Track custom event
     */
    track(eventType, data = {}) {
        // Only track if we have a valid product_id
        if (!this.productId || this.productId === 'null' || this.productId === null) {
            return; // Silently skip tracking if no product_id
        }
        
        const payload = {
            product_id: this.productId,
            event_id: this.eventId,
            booth_id: this.boothId,
            event_type: eventType,
            url: window.location.href,
            ...data,
        };
        
        fetch(`${this.apiBaseUrl}/public/analytics/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for visitor/session tracking
            body: JSON.stringify(payload),
        }).catch(err => {
            console.warn('Failed to track event:', err);
        });
    }
    
    /**
     * Extract UTM parameters from URL
     */
    extractUTMParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const utmParams = {};
        
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
            const value = urlParams.get(param);
            if (value) {
                utmParams[param] = value;
            }
        });
        
        return utmParams;
    }
    
    getSessionId() {
        // 1. Try to read existing session id
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === '_session_id') {
                return value;
            }
        }
    
        // 2. Create a new session id if not found
        const sessionId = crypto.randomUUID();
    
        // 3. Store in cookie (30 minutes session)
        document.cookie = `_session_id=${sessionId}; path=/; max-age=${60 * 30}; SameSite=Lax`;
    
        return sessionId;
    }
    
    
    /**
     * Manually track a custom event
     */
    trackCustomEvent(eventType, data = {}) {
        this.track(eventType, data);
    }
}

// Auto-initialize if data attributes are present
document.addEventListener('DOMContentLoaded', () => {
    const trackerElement = document.querySelector('[data-tracker]');
    if (trackerElement) {
        const productId = trackerElement.getAttribute('data-product-id');
        const eventId = trackerElement.getAttribute('data-event-id');
        const boothId = trackerElement.getAttribute('data-booth-id');
        const apiBaseUrl = trackerElement.getAttribute('data-api-base-url') || '/api';
        
        if (productId) {
            window.landingPageTracker = new LandingPageTracker({
                productId: parseInt(productId),
                eventId: eventId ? parseInt(eventId) : null,
                boothId: boothId ? parseInt(boothId) : null,
                apiBaseUrl: apiBaseUrl,
            });
        }
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LandingPageTracker;
}
