function normalizeText(text) {
    // Remove multiple spaces and normalize spacing
    return text.replace(/\s+/g, ' ').trim();
}

// Enhanced name anonymization function with context awareness
function anonymizeText(text) {
    // Normalize text before anonymizing
    text = normalizeText(text);

    // Regular expression for name anonymization (handle first and last name)
    const namePattern = /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)?\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)(?:\s+(?:Jr\.|Sr\.|II|III))?\b/g;

    // Replace names with initials if found in a professional context
    return text.replace(namePattern, function(match, firstName, lastName) {
        const context = getContext(text, match);
        
        // If the name appears in the context of a job or profile, anonymize it
        if (context.includes('designer') || context.includes('engineer') || context.includes('developer') || context.includes('profile')) {
            return `${firstName.charAt(0)}.${lastName.charAt(0)}.`;
        }
        return `${firstName} ${lastName}`;
    });
}


// Context analysis function to get surrounding text context of the match
function getContext(text, match, radius = 100) {
    const startIndex = text.indexOf(match);
    const start = Math.max(0, startIndex - radius);
    const end = Math.min(text.length, startIndex + match.length + radius);
    return text.slice(start, end).toLowerCase();
}


// File processing function
function processFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const errorDiv = document.getElementById('error');
    
    if (!file) {
        errorDiv.style.display = 'block';
        return;
    }
    
    errorDiv.style.display = 'none';
    const reader = new FileReader();
    
    // For PDF files
    if (file.type === "application/pdf") {
        reader.onload = function(event) {
            const pdfData = new Uint8Array(event.target.result);
            extractTextFromPDF(pdfData);
        };
        reader.readAsArrayBuffer(file);
    }
    // For DOCX files
    else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            extractTextFromDOCX(arrayBuffer);
        };
        reader.readAsArrayBuffer(file);
    }
    // For TXT files
    else if (file.type === "text/plain") {
        reader.onload = function(event) {
            const text = event.target.result;
            displayText(text);
        };
        reader.readAsText(file);
    } else {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Error: Unsupported file type.';
    }
}

// Extract text from PDF file
function extractTextFromPDF(pdfData) {
    pdfjsLib.getDocument(pdfData).promise.then(function(pdfDoc) {
        let textContent = "";
        let promises = [];
        
        // Loop through all pages and extract text
        for (let i = 1; i <= pdfDoc.numPages; i++) {
            promises.push(pdfDoc.getPage(i).then(function(page) {
                return page.getTextContent().then(function(text) {
                    textContent += text.items.map(item => item.str).join(" ") + "\n";
                });
            }));
        }
        
        Promise.all(promises).then(function() {
            displayText(textContent);
        });
    }).catch(function(error) {
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').textContent = `Error extracting PDF text: ${error.message}`;
    });
}

// Extract text from DOCX file
function extractTextFromDOCX(arrayBuffer) {
    mammoth.extractRawText({ arrayBuffer: arrayBuffer })
        .then(function(result) {
            displayText(result.value);
        })
        .catch(function(err) {
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').textContent = `Error extracting DOCX text: ${err}`;
        });
}

// Display text in text areas
function displayText(text) {
    document.getElementById('textArea').value = text;
    const anonymizedText = anonymizeText(text);
    document.getElementById('anonymizedTextArea').value = anonymizedText;
}