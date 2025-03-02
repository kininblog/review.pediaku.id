// app.js - Client Side
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Handle routing client-side
    const path = window.location.pathname.slice(1);
    if (path) loadReview(path);

    // Handle form submission
    document.getElementById('searchForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const domain = document.getElementById('domainInput').value;
        if (validateDomain(domain)) {
            window.history.pushState(null, null, `/${domain}`);
            await loadReview(domain);
        }
    });
}

async function loadReview(domain) {
    try {
        showLoading();
        const response = await fetch(`/.netlify/functions/getMetadata?domain=${domain}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        renderReview(data);
        injectSchemaMarkup(data);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function renderReview(data) {
    const template = `
        <div class="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
            <div class="p-8">
                <h2 class="text-2xl font-bold mb-4">${data.title}</h2>
                ${data.description ? `<p class="text-gray-600 mb-4">${data.description}</p>` : ''}
                <div class="space-y-2">
                    <p><span class="font-semibold">Domain:</span> ${data.domain}</p>
                    ${data.cname ? `<p><span class="font-semibold">CNAME:</span> ${data.cname}</p>` : ''}
                </div>
                <!-- Tambahkan komponen rating dan review di sini -->
            </div>
        </div>
    `;
    document.getElementById('content').innerHTML = template;
}

function injectSchemaMarkup(data) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Review",
        "itemReviewed": {
            "@type": "WebSite",
            "name": data.title,
            "url": data.domain
        },
        "reviewRating": {
            "@type": "Rating",
            "ratingValue": "4.5"
        }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
}

// Serverless Function (netlify/functions/getMetadata.js)
const fetch = require('node-fetch');
const cheerio = require('cheerio');

exports.handler = async (event) => {
    const domain = event.queryStringParameters.domain;
    
    if (!domain.match(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Format domain tidak valid' }) };
    }

    try {
        const response = await fetch(`https://${domain}`);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const metadata = {
            domain: domain,
            title: $('title').text(),
            description: $('meta[name="description"]').attr('content'),
            cname: await getCname(domain)
        };

        return { statusCode: 200, body: JSON.stringify(metadata) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Gagal mengambil data' }) };
    }
};

async function getCname(domain) {
    // Implementasi DNS lookup untuk CNAME
    // (Menggunakan library DNS atau API pihak ketiga)
}