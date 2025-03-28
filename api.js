const limit = 20;
let totalCount = 0;
let allResults = [];
const CACHE_DURATION = 60000; // 60 segundos en milisegundos
let apiAccessTime = null;

function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    return (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes);
}

function isCacheValid() {
    const cachedTimestamp = localStorage.getItem('lastFetch');
    if (!cachedTimestamp) return false;
    
    const now = Date.now();
    return (now - parseInt(cachedTimestamp)) < CACHE_DURATION;
}

function fetchPage(offset, forceRefresh = false) {
    if (offset === 0 && isCacheValid() && !forceRefresh) {
        const cachedData = JSON.parse(localStorage.getItem('trainData'));
        apiAccessTime = new Date(parseInt(localStorage.getItem('lastFetch')));
        
        allResults = cachedData.results;
        totalCount = cachedData.total_count;
        
        localStorage.setItem('timestamp', apiAccessTime.toLocaleString());
        localStorage.setItem('trainCount', totalCount.toString());
        
        return Promise.resolve();
    }

    const apiUrl = `https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets/posicionament-dels-trens/records?limit=${limit}&offset=${offset}`;
    return fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (offset === 0 && data.total_count) {
                totalCount = data.total_count;
                apiAccessTime = new Date();
            }
            
            if (data.results && Array.isArray(data.results)) {
                allResults = allResults.concat(data.results);
            }
            
            if (offset + limit < totalCount) {
                return fetchPage(offset + limit, forceRefresh);
            } else {
                // Guardamos en localStorage SOLO cuando tengamos todos los resultados
                localStorage.setItem('trainData', JSON.stringify({
                    results: allResults,
                    total_count: totalCount
                }));
                localStorage.setItem('lastFetch', Date.now().toString());
                localStorage.setItem('timestamp', apiAccessTime.toLocaleString());
                localStorage.setItem('trainCount', totalCount.toString());
            }

            console.log('Total trenes guardados:', allResults.length);
            console.log('Total trenes en localStorage:', JSON.parse(localStorage.getItem('trainData')).results.length);
        })
        .catch(error => console.error('Error al obtener los datos:', error));
}

function refreshData() {
    allResults = [];
    // Forzamos la paginación completa ignorando la caché
    fetchPage(0, true);
}

// Inicia la carga de datos y programa el refresco cada 60 segundos
document.addEventListener("DOMContentLoaded", function(){
    fetchPage(0).then(() => {
        setInterval(refreshData, 60000);
    });
});