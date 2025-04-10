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


interface QuestionStage {
    id: number; // Array of 5 question IDs
    stage: number; // 1-15
}

interface SelectedQuestion {
    id:number
}
export function getQuestionsByStage(questions: QuestionStage[])
                        : SelectedQuestion[] {
    if (questions.length < 15) {
        throw new Error(`Expected at least 15 stages, got ${questions.length}`);
    }

    const stageMap = new Map<number, number[]>();

    for (const question of questions) {
        const { id, stage } = question;
        const stageQuestions = stageMap.get(stage) ?? [];
        stageMap.set(stage, [...stageQuestions, id]);
    }
    
    // Check for stage 15
    const hasStage15 = stageMap.has(15);
    if (!hasStage15) {
        console.log(stageMap);
    }
    
    // Select random questions
    function getRandomQuestion(stage: number): SelectedQuestion {
        const questions = stageMap.get(stage) ?? [];
        if (questions.length === 0) {
            throw new Error(`No questions found for stage ${stage}`);
        }
        const randomIndex = Math.floor(Math.random() * questions.length);
        const qid = questions[randomIndex]!
        return { id: qid};
    }
    
    const stages = Array.from(stageMap.keys());
    const result: SelectedQuestion[] = stages.map(getRandomQuestion);

    return result;
}