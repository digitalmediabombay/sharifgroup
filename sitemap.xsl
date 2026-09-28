<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
    <xsl:template match="/">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
            <head>
                <title>XML Sitemap | Sharif Group Dubai</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="icon" type="image/svg+xml" href="/assets/images/Group-427321463.svg" />
                <link rel="alternate icon" type="image/x-icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/Group-427321463.svg" />
                <style type="text/css">
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        color: #1e293b;
                        background: #f8fafc;
                        line-height: 1.5;
                        padding: 32px 24px;
                    }
                    .container {
                        max-width: 1240px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 16px;
                        box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                    }
                    .header {
                        background: linear-gradient(135deg, #0b192c 0%, #1e293b 100%);
                        color: #ffffff;
                        padding: 36px 40px;
                        border-bottom: 3px solid #d4af37;
                    }
                    .brand-row {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 16px;
                        margin-bottom: 12px;
                    }
                    .brand-title {
                        font-size: 24px;
                        font-weight: 700;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .brand-gold {
                        color: #d4af37;
                    }
                    .badge-sitemap {
                        background: rgba(212, 175, 55, 0.2);
                        color: #fce79a;
                        border: 1px solid rgba(212, 175, 55, 0.4);
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    .header-desc {
                        font-size: 14px;
                        color: #94a3b8;
                        max-width: 800px;
                        line-height: 1.6;
                    }
                    .header-desc a {
                        color: #fce79a;
                        text-decoration: underline;
                    }
                    .meta-bar {
                        background: #f1f5f9;
                        padding: 18px 40px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 20px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .stat-group {
                        display: flex;
                        align-items: center;
                        gap: 24px;
                        flex-wrap: wrap;
                    }
                    .stat-item {
                        display: flex;
                        align-items: baseline;
                        gap: 8px;
                    }
                    .stat-label {
                        font-size: 13px;
                        color: #64748b;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .stat-val {
                        font-size: 18px;
                        font-weight: 700;
                        color: #0b192c;
                    }
                    .filter-bar {
                        padding: 20px 40px;
                        background: #ffffff;
                        border-bottom: 1px solid #f1f5f9;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 16px;
                    }
                    .search-input {
                        flex: 1;
                        min-width: 280px;
                        max-width: 420px;
                        padding: 10px 16px;
                        border: 1px solid #cbd5e1;
                        border-radius: 8px;
                        font-size: 14px;
                        outline: none;
                        transition: border-color 0.2s, box-shadow 0.2s;
                    }
                    .search-input:focus {
                        border-color: #d4af37;
                        box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
                    }
                    .lang-tabs {
                        display: flex;
                        gap: 8px;
                    }
                    .tab-btn {
                        padding: 8px 14px;
                        border: 1px solid #cbd5e1;
                        background: #ffffff;
                        color: #475569;
                        border-radius: 8px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .tab-btn:hover {
                        border-color: #0b192c;
                        color: #0b192c;
                    }
                    .tab-btn.active {
                        background: #0b192c;
                        color: #ffffff;
                        border-color: #0b192c;
                    }
                    .table-wrapper {
                        overflow-x: auto;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 13.5px;
                        text-align: left;
                    }
                    thead th {
                        background: #f8fafc;
                        color: #475569;
                        padding: 14px 20px;
                        font-weight: 600;
                        text-transform: uppercase;
                        font-size: 11.5px;
                        letter-spacing: 0.6px;
                        border-bottom: 2px solid #e2e8f0;
                        white-space: nowrap;
                    }
                    tbody tr {
                        border-bottom: 1px solid #f1f5f9;
                        transition: background-color 0.15s ease;
                    }
                    tbody tr:hover {
                        background-color: #f8fafc;
                    }
                    tbody td {
                        padding: 14px 20px;
                        vertical-align: middle;
                    }
                    .col-idx {
                        color: #94a3b8;
                        font-size: 12px;
                        font-weight: 500;
                        width: 48px;
                        text-align: center;
                    }
                    .url-link {
                        color: #0284c7;
                        text-decoration: none;
                        font-weight: 500;
                        white-space: nowrap;
                        display: inline-block;
                    }
                    .url-link:hover {
                        color: #0369a1;
                        text-decoration: underline;
                    }
                    .badge-lang {
                        display: inline-block;
                        padding: 2px 8px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-right: 6px;
                    }
                    .badge-lang-en { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
                    .badge-lang-fa { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
                    .badge-lang-ar { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
                    .badge-lang-zh { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

                    .priority-wrap {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .priority-pill {
                        font-weight: 700;
                        font-size: 12px;
                        color: #334155;
                        min-width: 28px;
                    }
                    .priority-bar-bg {
                        width: 60px;
                        height: 6px;
                        background: #e2e8f0;
                        border-radius: 3px;
                        overflow: hidden;
                    }
                    .priority-bar-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #d4af37, #f59e0b);
                        border-radius: 3px;
                    }
                    .freq-tag {
                        display: inline-block;
                        padding: 3px 8px;
                        background: #f1f5f9;
                        color: #475569;
                        border-radius: 6px;
                        font-size: 11.5px;
                        font-weight: 500;
                        text-transform: capitalize;
                    }
                    .date-text {
                        color: #64748b;
                        font-size: 12.5px;
                        white-space: nowrap;
                    }
                    .footer-note {
                        padding: 20px 40px;
                        background: #ffffff;
                        border-top: 1px solid #f1f5f9;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 12.5px;
                        color: #94a3b8;
                    }
                    .footer-note a {
                        color: #64748b;
                        text-decoration: none;
                    }
                    .footer-note a:hover {
                        color: #0b192c;
                    }
                </style>
                <script type="text/javascript">
                <xsl:text disable-output-escaping="yes"><![CDATA[
                    var currentLang = 'all';
                    var currentQuery = '';

                    function filterRows() {
                        var rows = document.querySelectorAll('tbody tr');
                        var visibleCount = 0;
                        rows.forEach(function(r) {
                            var url = (r.getAttribute('data-url') || '').toLowerCase();
                            var lang = r.getAttribute('data-lang') || 'en';

                            var matchQuery = !currentQuery || (url.indexOf(currentQuery) !== -1);
                            var matchLang = (currentLang === 'all') || (lang === currentLang);

                            if (matchQuery) {
                                if (matchLang) {
                                    r.style.display = '';
                                    visibleCount++;
                                    return;
                                }
                            }
                            r.style.display = 'none';
                        });
                        var countEl = document.getElementById('visibleCount');
                        if (countEl) countEl.textContent = visibleCount;
                    }

                    function onSearch(e) {
                        currentQuery = (e.target.value || '').trim().toLowerCase();
                        filterRows();
                    }

                    function setLang(lang, btn) {
                        currentLang = lang;
                        document.querySelectorAll('.tab-btn').forEach(function(b) {
                            b.classList.remove('active');
                        });
                        if (btn) btn.classList.add('active');
                        filterRows();
                    }

                    document.addEventListener('DOMContentLoaded', function() {
                        var countEl = document.getElementById('visibleCount');
                        var totalEl = document.getElementById('totalCount');
                        var rows = document.querySelectorAll('tbody tr');
                        if (countEl) countEl.textContent = rows.length;
                        if (totalEl) totalEl.textContent = rows.length;
                    });
                ]]></xsl:text>
                </script>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="brand-row">
                            <div class="brand-title">
                                <img src="/assets/images/Group-427321463.svg" alt="Sharif Group Logo" style="width: 28px; height: 32px; object-fit: contain;" />
                                <span>SHARIF GROUP <span class="brand-gold">DUBAI</span></span>
                            </div>
                            <span class="badge-sitemap">Standard XML Protocol 0.9</span>
                        </div>
                        <p class="header-desc">
                            Automated Multilingual XML Sitemap for search engines and web crawlers (Google, Bing, Yandex). 
                            Includes full reciprocal <a href="https://developers.google.com/search/docs/specialty/international/localized-versions" target="_blank" rel="noopener">hreflang alternates</a> for English, Persian (Farsi), Arabic, and Chinese.
                        </p>
                    </div>

                    <div class="meta-bar">
                        <div class="stat-group">
                            <div class="stat-item">
                                <span class="stat-label">Total URLs:</span>
                                <span class="stat-val" id="totalCount"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Showing:</span>
                                <span class="stat-val" id="visibleCount"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Languages:</span>
                                <span class="stat-val">EN / FA / AR / ZH</span>
                            </div>
                        </div>
                    </div>

                    <div class="filter-bar">
                        <input type="text" class="search-input" placeholder="Search page URL or slug..." onkeyup="onSearch(event)" />
                        <div class="lang-tabs">
                            <button type="button" class="tab-btn active" onclick="setLang('all', this)">All</button>
                            <button type="button" class="tab-btn" onclick="setLang('en', this)">English</button>
                            <button type="button" class="tab-btn" onclick="setLang('fa', this)">Farsi (fa)</button>
                            <button type="button" class="tab-btn" onclick="setLang('ar', this)">Arabic (ar)</button>
                            <button type="button" class="tab-btn" onclick="setLang('zh', this)">Chinese (zh)</button>
                        </div>
                    </div>

                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th class="col-idx">#</th>
                                    <th>Page URL</th>
                                    <th>Lang</th>
                                    <th>Priority</th>
                                    <th>Change Frequency</th>
                                    <th>Last Modified</th>
                                </tr>
                            </thead>
                            <tbody>
                                <xsl:for-each select="sitemap:urlset/sitemap:url">
                                    <xsl:variable name="itemUrl" select="sitemap:loc" />
                                    <xsl:variable name="itemLang">
                                        <xsl:choose>
                                            <xsl:when test="contains($itemUrl, '/fa/')">fa</xsl:when>
                                            <xsl:when test="contains($itemUrl, '/ar/')">ar</xsl:when>
                                            <xsl:when test="contains($itemUrl, '/zh/')">zh</xsl:when>
                                            <xsl:otherwise>en</xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:variable>
                                    <tr data-url="{$itemUrl}" data-lang="{$itemLang}">
                                        <td class="col-idx"><xsl:value-of select="position()" /></td>
                                        <td>
                                            <a class="url-link" href="{$itemUrl}" target="_blank" rel="noopener">
                                                <xsl:value-of select="$itemUrl" />
                                            </a>
                                        </td>
                                        <td>
                                            <xsl:choose>
                                                <xsl:when test="$itemLang = 'en'">
                                                    <span class="badge-lang badge-lang-en">EN</span>
                                                </xsl:when>
                                                <xsl:when test="$itemLang = 'fa'">
                                                    <span class="badge-lang badge-lang-fa">FA</span>
                                                </xsl:when>
                                                <xsl:when test="$itemLang = 'ar'">
                                                    <span class="badge-lang badge-lang-ar">AR</span>
                                                </xsl:when>
                                                <xsl:when test="$itemLang = 'zh'">
                                                    <span class="badge-lang badge-lang-zh">ZH</span>
                                                </xsl:when>
                                            </xsl:choose>
                                        </td>
                                        <td>
                                            <div class="priority-wrap">
                                                <span class="priority-pill"><xsl:value-of select="sitemap:priority" /></span>
                                                <div class="priority-bar-bg">
                                                    <div class="priority-bar-fill" style="width: {number(sitemap:priority) * 100}%"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="freq-tag"><xsl:value-of select="sitemap:changefreq" /></span>
                                        </td>
                                        <td>
                                            <span class="date-text"><xsl:value-of select="sitemap:lastmod" /></span>
                                        </td>
                                    </tr>
                                </xsl:for-each>
                            </tbody>
                        </table>
                    </div>

                    <div class="footer-note">
                        <span>Sharif Group Dubai © All Rights Reserved</span>
                        <a href="https://sharifgroup.ae" target="_blank">sharifgroup.ae</a>
                    </div>
                </div>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
