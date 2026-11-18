/**
 * Sharif Group - On-Demand Articles Database Loader (T41 Optimization)
 * Dynamically loads localized article datasets without blocking initial page render.
 */
(function() {
    window.articlesDatabase = window.articlesDatabase || {};
    window.__articlesDbLoaded = window.__articlesDbLoaded || {};

    window.loadArticlesDatabase = function(lang) {
        lang = (lang || document.documentElement.lang || 'en').toLowerCase();
        if (window.__articlesDbLoaded[lang]) {
            return Promise.resolve(window.articlesDatabase);
        }
        var url = '/assets/locales/articles_' + lang + '.json';
        return fetch(url)
            .then(function(res) {
                if (!res.ok) throw new Error('Status ' + res.status);
                return res.json();
            })
            .then(function(data) {
                window.articlesDatabase = Object.assign(window.articlesDatabase, data);
                window.__articlesDbLoaded[lang] = true;
                return window.articlesDatabase;
            })
            .catch(function(err) {
                console.warn('Articles DB loader notice for ' + lang + ':', err);
                return window.articlesDatabase;
            });
    };
})();
