export function continueInChatGPT(text: string) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
            window.open("https://chat.openai.com", "_blank");
        }, function(err) {
            console.error('Could not copy text: ', err);
            // Fallback for browsers that don't support clipboard API well
            window.open("https://chat.openai.com", "_blank");
        });
    } else {
        // Fallback for older browsers
        window.open("https://chat.openai.com", "_blank");
    }
}
