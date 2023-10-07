/**
 * ------------------------------------------------------
 * Simple HTML includes
 * Steve Copley 2023
 * ------------------------------------------------------
 *
 * Parses the document for any <include> tags
 * The src attribute of this tag is the file to include
 * The <include> tag is *replaced* by the HTML in the file
 *
 * e.g. <include src="header.html">
 *
 * ------------------------------------------------------
 * Passing Date to the Include
 *  - data-XXXX attributes can be given in the <include>
 *  - Any tags in the file HTML that have matching
 *  - data-set-XXXX attributes have their contenst replaced
 *    with the data-XXXX atrribute value
 *
 * e.g. <include src="header.html" data-title="Welcome">
 *      In the file's HTML: <h1 data-set-title></h1>
 *      Results in <h1>Welcome</h1>
 *
 * ------------------------------------------------------
 * Note that nested includes aren't catered for.
 * It would be relatively sinmple to make this a recursive
 * process, but I wanted to keep this fast and simple
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Hide body until we're done
    document.body.style.opacity = 0;

    // Get all <include> elements
    const allIncludes = document.querySelectorAll('include');
    // Get a promise based on updating each one
    const includePromises = [...allIncludes].map(include => loadHTML(include));
    // And wait for them all...
    await Promise.all(includePromises);

    // Bring the body back into view. The delay damps the body jumping about
    setTimeout(() => { document.body.style.opacity = 1; }, 10);

    //
    async function loadHTML(element) {
        // Get the URL of the file of HTML to include
        const file = element.getAttribute('src');

        try {
            // Load the file
            const response = await fetch(file);
            // Bail out of the file can't be loaded
            if (!response.ok) throw new Error(response.status);

            // Process the contents
            let html = await response.text();

            // Create a new element from the HTML
            html = html.trim();
            const template = document.createElement('template');
            template.innerHTML = html;
            const newElement = template.content.firstElementChild;

            // Check loaded HTML elements...
            [...newElement.children].forEach(child => {
                // ... to see if they have data attributes and they are for setting data
                Object.keys(child.dataset).filter(dataItem => dataItem.substring(0,3) === 'set').forEach(dataItem => {
                    // Get the name of the value we are to use
                    let dataValueRequired = dataItem.substring(3);
                    // First letter will be uppercase. We need it lowercase to match values in dataset
                    dataValueRequired = dataValueRequired.charAt(0).toLowerCase() + dataValueRequired.slice(1);
                    // Do we have a suitable data value from the original element?
                    if (dataValueRequired in element.dataset) {
                        // Stick the value into the element
                        child.innerHTML = element.dataset[dataValueRequired];
                        // Scrub the attribute away
                        delete child.dataset[dataItem];
                    }
                });
            });

            // Replace the include element with our new one
            element.replaceWith(newElement);
        }
        catch (error) {
            element.innerHTML = `Error ${error.message} loading ${file}`;
        }
    }
});