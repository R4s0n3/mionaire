export function shuffle<T>(array: readonly T[]): T[] {
    const copy = [...array];
    const n = copy.length;
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i]!;  
        copy[i] = copy[j]!;     
        copy[j] = temp;
    }
    return copy;
}