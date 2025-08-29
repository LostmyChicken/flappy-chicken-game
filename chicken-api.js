// Enhanced chicken image loader that tries to fetch real chicken images
async function loadRandomChickenImage() {
    const chickenApis = [
        // Try different approaches to get chicken images
        {
            name: 'Unsplash',
            url: 'https://source.unsplash.com/100x80/?chicken',
            fallback: true
        },
        {
            name: 'Lorem Picsum',
            url: 'https://picsum.photos/100/80?random=' + Math.floor(Math.random() * 1000),
            fallback: true
        }
    ];
    
    for (const api of chickenApis) {
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    console.log(`Successfully loaded image from ${api.name}`);
                    chickenImage = img;
                    imageLoaded = true;
                    resolve();
                };
                
                img.onerror = () => {
                    console.log(`Failed to load from ${api.name}`);
                    reject();
                };
                
                img.src = api.url;
            });
            
            return; // Success, exit the function
            
        } catch (error) {
            console.log(`Error with ${api.name}:`, error);
            continue; // Try next API
        }
    }
    
    // If all APIs fail, create SVG chicken
    console.log('All APIs failed, using SVG chicken');
    createSVGChicken();
}

function createSVGChicken() {
    const img = new Image();
    const svgChicken = `
        <svg width="50" height="40" xmlns="http://www.w3.org/2000/svg">
            <!-- Chicken body -->
            <ellipse cx="25" cy="25" rx="18" ry="12" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
            <!-- Chicken head -->
            <circle cx="35" cy="15" r="8" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
            <!-- Beak -->
            <polygon points="40,15 47,17 40,19" fill="#FF8C00"/>
            <!-- Eye -->
            <circle cx="37" cy="12" r="1.5" fill="#000"/>
            <circle cx="37.5" cy="11.5" r="0.5" fill="#FFF"/>
            <!-- Comb -->
            <path d="M 32 8 Q 34 5 36 8 Q 38 5 40 8 Q 38 10 36 8 Q 34 10 32 8" fill="#FF0000"/>
            <!-- Wing -->
            <ellipse cx="22" cy="20" rx="6" ry="8" fill="#FFA500" stroke="#FF8C00" stroke-width="1"/>
            <!-- Wing details -->
            <path d="M 18 18 Q 22 16 26 20 Q 22 24 18 22" fill="#FF8C00"/>
            <!-- Tail feathers -->
            <ellipse cx="10" cy="22" rx="4" ry="8" fill="#FFA500" stroke="#FF8C00" stroke-width="1"/>
            <ellipse cx="8" cy="20" rx="3" ry="6" fill="#FF8C00"/>
            <!-- Legs -->
            <rect x="20" y="35" width="2" height="4" fill="#FF8C00"/>
            <rect x="28" y="35" width="2" height="4" fill="#FF8C00"/>
            <!-- Feet -->
            <path d="M 18 39 L 24 39 M 21 39 L 21 41" stroke="#FF8C00" stroke-width="1" fill="none"/>
            <path d="M 26 39 L 32 39 M 29 39 L 29 41" stroke="#FF8C00" stroke-width="1" fill="none"/>
        </svg>
    `;
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgChicken);
    img.onload = () => {
        chickenImage = img;
        imageLoaded = true;
        console.log('SVG chicken loaded successfully!');
    };
}

// Replace the original loadChickenImage function
if (typeof loadChickenImage !== 'undefined') {
    loadChickenImage = loadRandomChickenImage;
}