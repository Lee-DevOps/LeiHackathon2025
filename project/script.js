// Enhanced name anonymization function for resume
function anonymizeText(text) {
    // Normalize text before anonymizing

    // Regular expression for name anonymization (handle first and last name)
    const namePattern = /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)?\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)(?:\s+(?:Jr\.|Sr\.|II|III))?\b/g;

    let firstNameAnonymized = false;  // Track if the first full name has been anonymized

    // Regular expression for email anonymization
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

    // First, anonymize emails
    text = text.replace(emailPattern, '[email protected]');  // Replace email with placeholder

    // Remove pronouns completely from the text
    text = text.replace(/\b(?:he|him|his|she|her|they|them|their|theirs)\b/gi, '');

    // Replace names with initials only for the first occurrence
    return text.replace(namePattern, function(match, firstName, lastName) {
        if (!firstNameAnonymized) {
            firstNameAnonymized = true; // Mark the first name occurrence as anonymized
            return `${firstName.charAt(0).toUpperCase()}. ${lastName.charAt(0).toUpperCase()}.`; // Return initials
        }
        // Return the full name for any other occurrence
        return `${firstName} ${lastName}`;
    });
}

// File processing function
function processFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const errorDiv = document.getElementById('error');
    
    if (!file) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Error: No file selected.';
        return;
    }
    
    errorDiv.style.display = 'none';

    const reader = new FileReader(); // Initialize reader here

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
