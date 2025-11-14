import readline from "readline";

export function promptQuery(
    promptText = "Enter a search query (or press Enter to exit): "
): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(promptText, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}