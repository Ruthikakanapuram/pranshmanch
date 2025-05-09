import { Injectable } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
// import Groq from 'groq-sdk';
import   OpenAIApi  from 'openai';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class QuestionsService {
  // private client: Groq;

  // constructor(private configService: ConfigService) {
  //   const apiKey = this.configService.get<string>('gpt-4o-mini');
  //   this.client = new Groq({ apiKey });
  // }

  private client: OpenAIApi;
  private filepath: string;
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('CHATGPT_KEY')
    this.client = new OpenAIApi({apiKey});
  
  }

  async generateQuestions(createQuestionDto: CreateQuestionDto) {
    //generating questions as per count using prompt 
    const { viva, debugcode, explaincode, predictop, theory, jumbledcode, completecode, topic, subject, criteria } = createQuestionDto;
    //  const prompt = `
    //  You are a ${subject} interviewer. The user has specified the number of questions they want for each type. Generate exactly the following number of questions of medium difficulty. Do not include answers or explanations. Output strictly in clean JSON format.

    //  - Viva questions: ${viva}
    //  - Debug code: ${debugcode}
    //  - Jumbled code: ${jumbledcode}
    //  - Complete code: ${completecode}
    //  - Explain code: ${explaincode}
    //  - Predict output: ${predictop}
    //  - Theory: ${theory}

    //  Each question type must follow these specific instructions:

    //  1. Viva - Ask basic conceptual questions related to ${subject}.
    //  2. Debug code - For each debug code question:
    //      - Provide a clear "question" describing exactly what the code is supposed to do.
    //      - Provide a "correct_code" containing the correct, working Java code.
    //      - Provide a "buggy_code" that contains both syntactic errors and logical errors.
    //  3. Jumbled code - For each jumbled code question:
    //      - Provide a "question" describing the goal.
    //      - Provide a "correct_code" that is the complete, correct Java code.
    //      - Provide a "jumbled_code", with the correct code shuffled by lines.
    //  4. Complete code - Incomplete Java code with missing parts, and ask students to complete it.
    //  5. Explain code - Full Java code snippet; student must explain its purpose.
    //  6. Predict output - Provide Java code and ask what it prints.
    //  7. Theory - Ask short theoretical questions related to ${subject}.

    //  Ensure strict JSON output only.
    //  `;

    //  const response = await this.client.chat.completions.create({
    //    model: 'gpt-4o-mini',
    //    messages: [
    //      {
    //        role: 'system',
    //        content: prompt,
    //      },
    //      {
    //        role: 'user',
    //        content: `Generate the questions based on ${topic}`,
    //      },
    //    ],
    //  });

    //return response.choices[0]?.message?.content || '';
    const results: any = {};
    if (viva > 0) results.viva = await this.generateVivaQuestions(subject, topic, viva, criteria);
    if (debugcode > 0) results.debugcode = await this.generateDebugQuestions(subject, topic, debugcode, criteria);
    if (explaincode > 0) results.explaincode = await this.generateExplaincodeQuestions(subject, topic, explaincode, criteria);
    if (completecode > 0) results.completecode = await this.generateCompletecodeQuestions(subject, topic, completecode, criteria);
    if (predictop > 0) results.predictop = await this.generatePredictOPQuestions(subject, topic, predictop, criteria);
    if (jumbledcode > 0) results.jumbledcode = await this.generateJumbledCodeQuestions(subject, topic, jumbledcode,criteria);
    if (theory > 0) results.theory = await this.generateTheoryQuestions(subject, topic, theory, criteria);

    return results;

  }

  async generateVivaQuestions(subject: string, topic: string, count: number, criteria: string) {
    // const prompt = `
    // You are an expert interviewer designing viva questions for B.Tech Computer Science undergraduate students.
    
    // Your task is to generate exactly ${count} high-quality **conceptual and thought-provoking viva questions** focused on:
    // - Subject: ${subject}
    // - Topic: ${topic}
    // - Criteria/Focus Area: ${criteria}
    
    // **Guidelines for generating questions:**
    // - Mix of **medium and low difficulty**.
    // - The questions should test **logical reasoning** or **deeper understanding** (as per Bloom's Taxonomy: apply, analyze, evaluate).
    // - The questions should encourage **explanation**, **reflection**, or **critical thinking**.
    // - DO NOT generate straightforward questions like "What is ___?" or "Write the abbreviation of ___".
    // - DO NOT repeat or paraphrase similar questions — ensure strict uniqueness.
    // - Questions should help assess the student's **conceptual clarity**, **analytical ability**, and **communication** skills.
    // - No yes/no questions.
    // - No definitions or lists-based questions.
    // - Return exactly ${count} questions — no more, no less.
    
    // **Return a valid strict JSON array**, each with a single key "question". Do not add any explanation, labels, or commentary.
    
    // **Format:**
    // [
    //   { "question": "..." },
    //   { "question": "..." }
    // ]
    // `;

    const prompt = `
You are an interviewer designing viva questions for B.Tech Computer Science undergraduate students.

Your task is to generate exactly ${count} high-quality **conceptual and thought-provoking viva questions** focused on:
- Topic: ${topic}
- Criteria/Focus Area: ${criteria}

**Guidelines for generating questions:**
- These questions are intended for a **viva (oral examination)** and must be suitable for **spoken response**, **interactive discussion**, or **on-the-spot explanation**.
- The questions should be **low difficulty** level.
- The questions should test **logical reasoning** or **deeper understanding** (as per Bloom's Taxonomy: apply, analyze, evaluate).
- Encourage **verbal explanation**, **reflection**, **real-time reasoning**, or **critical thinking** — avoid written-style questions.
- Avoid broad essay-style, derivation-heavy, or lengthy design-based questions meant for written exams.
- DO NOT generate straightforward questions like "What is ___?" or "Write the abbreviation of ___".
- DO NOT repeat or paraphrase similar questions — ensure strict uniqueness.
- No yes/no questions.
- No definition or list-based questions.
- Ensure questions are **clearly distinct from theory exam questions** — they must reflect the **spontaneous and verbal nature of a viva**.
- Return exactly ${count} questions — no more, no less.

**Return a valid strict JSON array**, each with a single key "question". Do not add any explanation, labels, or commentary.

**Format:**
[
  { "question": "..." },
  { "question": "..." }
]
`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      // temperature: 0.8,
      messages: [
        { role: 'system', content: prompt },
       // { role: 'user', content: 'generate medium difficulty' },
      ],
    });

    return response.choices[0]?.message?.content;
  }


  async generateDebugQuestions(subject: string, topic: string, count: number, criteria: string) {
    const seed = Date.now();

    //   const prompt = `
    // You are an expert-level ${subject} interviewer.

    // Your task is to generate exactly ${count} **debug code questions** for the topic "${topic}", focusing on "${criteria}".

    // Each question must return a JSON object with:
    // - "question": A precise description of what the code is supposed to accomplish (no titles, no markdown, no extra text).
    // - "buggy_code": A ${subject} code snippet with **both syntax and logic errors**.
    // - "correct_code": A fully working ${subject} implementation of the described behavior.

    // STRICT RULES:
    // - The "question" field must **only** contain the clear problem statement. Do **not** add phrases like "Here is a question" or markdown like **Question:** or backticks.
    // - The response must be a **JSON array of objects**, like:
    //   [
    //     {
    //       "question": "Write a program that checks whether a number is a palindrome.",
    //       "buggy_code": "...",
    //       "correct_code": "..."
    //     }
    //   ]
    // - Do not include markdown formatting, headings, bullet points, explanations, or any wrapping text.
    // - Use realistic, moderately complex examples that reflect real-world debugging scenarios.
    // - The output should be fully parseable as JSON.


    // Only return the JSON array as specified above. No other text.
    // `;

    //RECENT-----------------------------
    // const prompt = `
    // You are an expert-level technical interviewer.
    
    // Your task is to generate **exactly ${count}** debug code questions for the topic "${topic}".
    
    // Use the following criteria to determine the specific focus topic:
    // "${criteria}"
    
    
    // Return a single JSON **array** of exactly ${count} questions. Do not include more or less.
    
    // Each object must contain:
    // - "question": A precise description of what the code is supposed to accomplish (no titles, no markdown, no extra text). Add this line after the question: "Find the bugs and correct the code to work the solution."
    // - "buggy_code": A ${topic} code snippet with **both syntax and logic errors**.
    // - "correct_code": A fully working ${topic} implementation of the described behavior based on ${criteria}.
    
    // Follow these strict rules:
    
    // - Each code snippet must be **5 to 15 lines long**.
    // - Focus on *realistic code scenarios* involving common bugs found in practical programming.
    // - Every buggy_code must include:
    //   - At least three **logic errors** (e.g., wrong condition, misplaced loop, incorrect return).
    //   - At least three **syntax errors** (e.g., missing semicolon, incorrect method signature, undeclared variable).
    // - Bugs must not be obvious — they should require attention to detail and understanding.
    // - Each question must be **unique**. Do not repeat logic or behavior.
    // - Errors must not be obvious at first glance. They should test the student's *attention to detail* and *understanding of the code's intent*.
    // - The correct_code must:
    //   - Fully solve the described problem.
    //   - Be complete and runnable, including input and output.
    //   - Include an example at the end in **LeetCode-style comment format**, like:
    //     / 3
    // - Code should not be trivial or overly simplistic — aim for **medium to low difficulty** suitable for **B.Tech CS undergraduates**.
    // - Do **not include any markdown, explanations, bullet points, or extra output** — return only the raw JSON array.
    
    // Only return a JSON array of ${count} question objects. Nothing else.
    // `;
     //RECENT-----------------------------

     const prompt = `
     You are an expert-level technical interviewer.
     
     Your task is to generate **exactly ${count}** debug code questions for the topic "${topic}".
     
     Use the following criteria to determine the specific focus topic:
     "${criteria}"
     
     Return a single JSON **array** of exactly ${count} questions. Do not include more or less.
     
     Each object must contain:
     - "question": A precise description of what the code is supposed to accomplish (no titles, no markdown, no extra text). Add this line after the question: "Find the bugs and correct the code to work the solution."
     - "correct_code": A fully working ${topic} implementation of the described behavior based on ${criteria}.
     - "buggy_code": A version of the **correct_code** that contains **only logic and conceptual bugs**. Do not introduce any syntax errors. The buggy version must be a modified copy of the correct code that looks syntactically valid but fails logically or conceptually.
     
     Use the following process:
     1. First, generate a clean and fully functional correct_code that solves the problem according to the criteria.
     2. Then, make a copy of that code and **introduce at least five distinct and non-obvious logic or conceptual bugs** (e.g., incorrect loop bounds, wrong condition, off-by-one error, misuse of data structure, wrong return value). You must include a **minimum of five such bugs** — fewer than five is unacceptable.
     3. Do **not** include any syntax errors and input/output explanations in the buggy_code. It should compile or run cleanly but produce incorrect results due to logic flaws.
     4. The **buggy_code must not include any input or output explanations**.
     5. Do **not comment the solutions or hints for the bugs in the buggy_code**. The bugs must be detected and corrected by the students.
     
     Additional rules:
     - Each code snippet must be **5 to 15 lines long**.
     - Focus on *realistic code scenarios* involving common but non-trivial bugs.
     - Bugs must not be obvious — they should require attention to detail and deep understanding.
     - Each question must be **unique** — avoid repetition in logic, problem statement, or code patterns.
     - The correct_code must:
       - Fully solve the described problem.
       - Be complete and runnable, including input and output.
       - Include an example at the end in **LeetCode-style comment format**, like:
     // Input: 3
     // Output: 6
     
     Do **not include any markdown, explanations, or extra output** — return only the raw JSON array of ${count} question objects.
     `;
     
//     const prompt = `You are an expert technical interviewer evaluating undergraduate students.

//   Generate ${count} debugging code questions in the subject ${subject}, focused on the topic ${topic}.

//   Each question must contain logical, syntax, or conceptual errors that test students' debugging and problem-solving abilities. Keep each buggy code 5–15 lines in length and of low to medium difficulty.

//   For eac/ Input: [1, 2, 3], 2  
        // Output:h question, strictly return only the following 4 sections in this exact format:

//   1. Question Title: (What the code is trying to do)

//   2. Buggy Code: (A code block with the incorrect implementation)

//   3. Sample Input/Output: (One sample input and the expected output)

//   4. Correct Code: (A code block with the correct implementation)

//  Do NOT include:
//     - Questions with **only syntax** or **only logic** errors — include both.
//     - Trivial tasks like "Print Hello World", "Check even/odd", or simple math.
//     - Any markdown formatting, explanations, bullet points, or surrounding text.`;
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.9,
      top_p: 0.95,
      presence_penalty: 0.6,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Generate now based on ${criteria}.` },
      ],
    });

    return response.choices[0]?.message?.content;
  }

  async generateExplaincodeQuestions(subject: string, topic: string, count: number, criteria: string) {
    //   const prompt = `
    // You are a technical interviewer for the subject: ${subject}. Generate exactly ${count} explain-code questions on the topic: ${topic}.

    // Follow these strict rules:
    // - The code must match this criteria: ${criteria}
    // - Do NOT include any explanation, difficulty level, or commentary.
    // - Only output:
    //    1. A clean, functional Java code snippet (without backticks or markdown)
    //    2. A single line: What does the above code do?

    // Repeat this format ${count} times, each with a different code snippet based on the topic.

    // Strict output format:
    // <Java code>
    // What does the above code do?
    // `;
   const prompt = `
You are an expert interviewer.

Your task is to generate exactly ${count} explain-code questions on the topic: "${topic}", following the criteria: "${criteria}".

Follow these STRICT GUIDELINES:

1. The code must be **100% functional and logically correct**.
2. Each code snippet must be **unique** — do not reuse logic across questions.
3. The questions must include **realistic, mid-level complexity**, challenging the candidate's **conceptual understanding** of the topic.
4. The code must involve **low to mid level logic** (e.g., recursion, multithreading, algorithms, data structures, or nuanced conditionals).
5. Each code snippet must be **between 5 to 15 lines long**. Avoid overly simplistic examples.
6. The question should require the candidate to explain:
   - The **overall behavior** of the code.
   - The **logic flow**, **edge cases**, and **dependencies** between the parts.
   - Why specific design or optimization choices were made.
7. Output must follow this exact format:
   <code>
   What does the above code do?
8. Do NOT include:
   - Any headings, titles, markdown, comments, or backticks.
   - Any explanation other than the final one-liner.
   - Any print-only or trivial examples (e.g., simple print statements or basic variable assignments).
9. Include code that uses **non-trivial constructs** (e.g., advanced array manipulation, data structure manipulation, lambda functions, callbacks, or asynchronous programming).
10. The code should **test deep understanding** — for example, the candidate should recognize patterns, understand runtime complexities, or identify edge cases.
11. Avoid using obvious or basic questions that can be solved with a simple explanation or straightforward answer.

Only output ${count} such examples. No extra text, wrapping, or explanation.

`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'generate now' },
      ],
    });

    return response.choices[0]?.message?.content;
  }




  async generateCompletecodeQuestions(subject: string, topic: string, count: number, criteria: string) {
    // const prompt = `  You are a ${subject} interviewer. Generate ${count} complete code questions on ${topic}.

    // Provide incomplete ${subject} code where key parts are missing, and ask the student to fill in the missing parts.`;
    // const prompt = `
    // You are a professional coding interviewer.

    // Generate exactly ${count} **complete-the-code** questions for the topic: "${topic}", based on the following criteria: "${criteria}".

    // Each question must return a JSON object with the following fields:

    // - "question": A clear, concise problem description. Avoid titles, markdown, or introductory phrases.
    // - "function_signature": A valid function signature in the given language (${criteria}).
    // - "input": A representative sample input, valid in that language.
    // - "input_explanation": A brief explanation of what the input represents.
    // - "output": The expected output for the provided input.
    // - "output_explanation": A brief justification for the output.
    // - "constraints": Realistic and meaningful constraints that apply to the problem.
    // - "correct_code": A complete, functional solution in the specified language that matches the question.

    // Strict Rules:
    // - Use appropriate syntax for the language specified in "${criteria}" (e.g., C++, Java, Python).
    // - The correct code must be fully working, clean, and match the function signature and problem described.
    // - The function_signature should not contain any logic, hints, solutions of the question and it should follow Leetcode style. The students will answer the code.
    // - Do NOT include any markdown formatting, comments, or headings.
    // - Do NOT add explanations, difficulty ratings, or surrounding text.
    // - Do NOT include broken or buggy code — only correct, tested solutions in correct_code.
    // - Ensure that all ${count} questions are unique and follow a medium level of difficulty suitable for B.Tech students.

    // The response must be a **JSON array** of ${count} such question objects. Example format:

    // [
    //   {
    //     "question": "Given a list of integers, return the longest increasing subsequence.",
    //     "function_signature": "int longestIncreasingSubsequence(vector<int>& nums)",
    //     "input": "[10, 9, 2, 5, 3, 7, 101, 18]",
    //     "input_explanation": "An unsorted list of integers.",
    //     "output": "4",
    //     "output_explanation": "The LIS is [2, 3, 7, 101] which has length 4.",
    //     "constraints": "1 <= nums.length <= 10^4, -10^4 <= nums[i] <= 10^4",
    //     "correct_code": "int longestIncreasingSubsequence(vector<int>& nums) { int n = nums.size(); vector<int> dp(n, 1); int ans = 1; for (int i = 1; i < n; i++) { for (int j = 0; j < i; j++) { if (nums[i] > nums[j]) dp[i] = max(dp[i], dp[j] + 1); } ans = max(ans, dp[i]); } return ans; }"
    //   }
    // ]

    // Return only the JSON array. No other commentary, formatting, or wrapping text.
    // `;

    const prompt = `
You are a professional coding interviewer.

Generate exactly ${count} **complete-the-code** questions for the topic: "${topic}", based on the following criteria: "${criteria}".

Each question must return a JSON object with the following fields:

- "question": A clear, concise problem description. Avoid titles, markdown, or introductory phrases.
- "function_signature": A valid function signature in the given language (${criteria}), written in **LeetCode style**. It should contain only the function declaration with parameter names and types, and no logic, hints, or partial solutions. Students will complete this function.
- "input": A representative sample input, valid in that language.
- "input_explanation": A brief explanation of what the input represents.
- "output": The expected output for the provided input.
- "output_explanation": A brief justification for the output.
- "constraints": Realistic and meaningful constraints that apply to the problem.
- "correct_code": A complete, functional solution in the specified language that matches the function signature and problem.

Strict Rules:
- The "function_signature" must be clean, with no logic or helper function, and written in the exact syntax of the specified language.
- The function body must be empty or omitted in the function signature, just like in LeetCode-style questions. Do not include any implementation, comment, or hint inside it.
- The correct_code field should contain the full working solution that will be used **internally** to evaluate the student’s implementation. It should be correct and tested.
- Do NOT include any markdown formatting, comments, titles, explanations, difficulty levels, or surrounding text.
- Ensure each question is unique and of medium difficulty, appropriate for B.Tech Computer Science undergraduates.
- Do NOT include broken or buggy code — only clean, functional solutions in correct_code.
- Return only a JSON array of ${count} question objects — no extra commentary or wrapping text.

Example format:

[
  {
    "question": "Given a list of integers, return the longest increasing subsequence.",
    "function_signature": "int longestIncreasingSubsequence(vector<int>& nums)",
    "input": "[10, 9, 2, 5, 3, 7, 101, 18]",
    "input_explanation": "An unsorted list of integers.",
    "output": "4",
    "output_explanation": "The LIS is [2, 3, 7, 101] which has length 4.",
    "constraints": "1 <= nums.length <= 10^4, -10^4 <= nums[i] <= 10^4",
    "correct_code": "int longestIncreasingSubsequence(vector<int>& nums) { int n = nums.size(); vector<int> dp(n, 1); int ans = 1; for (int i = 1; i < n; i++) { for (int j = 0; j < i; j++) { if (nums[i] > nums[j]) dp[i] = max(dp[i], dp[j] + 1); } ans = max(ans, dp[i]); } return ans; }"
  }
]
`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'generate medium difficulty' },
      ],
    });

    return response.choices[0]?.message?.content;

  }

  async generatePredictOPQuestions(subject: string, topic: string, count: number, criteria: string) {
    // const prompt = `You are a ${subject} interviewer. Generate ${count} explain code questions on ${topic}.
    // Provide ${subject} code and ask the student to predict the output after execution.
    // `;
    // const prompt = `
    // You are a professional ${subject} interviewer.

    // Generate exactly ${count} **predict-the-output** questions for the topic: "${topic}" based on the following criteria: "${criteria}".

    // Each question must return a JSON object with the following fields:

    // - "question": A short instruction: "What is the output of the following code?"
    // - "code": A complete, syntactically correct ${criteria} code snippet.
    // - "output": The exact output the candidate is expected to write after executing the code.
    // - "explanation": A brief explanation of how the output is derived, highlighting any tricky behavior (e.g., scoping, loops, recursion, object behavior, etc.).

    // Strict Rules:
    // - Do NOT include any markdown, titles, or headings.
    // - Code must be complete and executable.
    // - The code should not use undefined behavior, randomness, or non-determinism.
    // - Make the questions **medium in difficulty** — include tricky control flow, function calls, loop nesting, recursion, or scope-based behavior.
    // - Avoid trivial examples (e.g., just printing a number).
    // - Each question must be unique and follow standard language conventions for the chosen ${criteria} language (e.g., Java, C++, Python).

    // Return the response as a valid **JSON array of ${count} objects** in this format:

    // [
    //   {
    //     "question": "What is the output of the following  code?",
    //     "code": "int main() { int a = 5; if (a = 0) cout << 'Zero'; else cout << 'Non-zero'; return 0; }",
    //     "output": "Non-zero",
    //     "explanation": "The condition uses assignment (a = 0), which evaluates to false, so 'Non-zero' is printed."
    //   }
    // ]

    // Only output the JSON array. Do NOT include explanations outside the JSON. Do NOT wrap in markdown or add surrounding text.
    // `;

    const prompt = `
You are a professional ${subject} interviewer.

Generate exactly ${count} **predict-the-output** questions for the topic: "${topic}" based on the following criteria: "${criteria}".

Each question must return a JSON object with the following fields:

- "question": A short instruction: "What is the output of the following code?"
- "code": A complete, syntactically correct ${criteria} code snippet (5–15 lines).

Strict Guidelines:

1. Do NOT include any markdown, headings, or formatting — return **only raw JSON**.
2. Code must be complete, correct, and executable — no pseudocode or partial blocks.
3. The logic should be **non-trivial** — avoid simple print statements, basic math, or direct variable assignments.
4. Every example must test the candidate’s **conceptual and logical understanding** of:
   - Function calls
   - Recursion
   - Loop behavior (nested, broken, skipped)
   - Variable scoping (global vs. local)
   - Short-circuiting, mutability, reference behavior
   - Object or array references and mutations
   - Default values or argument order
5. The code must be **medium in difficulty** — not too easy, but clear enough to follow and reason through.
6. Avoid:
   - Randomness or undefined behavior
   - User input or external I/O
   - Over-simplified patterns or common print-only examples
7. The **only way to determine the output should be by reasoning through the code line by line** — not guesswork.
8. Each question must be logically unique and should not reuse patterns or traps from other questions.
9. Do NOT include "output" or "explanation" fields — only include "question" and "code".

Return the response as a valid **JSON array of exactly ${count} objects** in the following format:

[
  {
    "question": "What is the output of the following code?",
    "code": "int main() { int a = 5; if (a = 0) cout << 'Zero'; else cout << 'Non-zero'; return 0; }"
  }
]

Only output the JSON array — no other text or formatting.
`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'generate medium difficulty' },
      ],
    });

    return response.choices[0]?.message?.content;
  }

  async generateJumbledCodeQuestions(subject: string, topic: string, count: number,criteria:string) {
    // const prompt = `You are a ${subject} interviewer. Generate ${count} explain code questions on ${topic}.
    //  For each jumbled code question:
    // - Provide a 'question' clearly describing what the Java code is supposed to do.
    // - Provide a 'correct_code' which is the complete correct working Java code.
    // - Provide a 'jumbled_code', where the correct code is split into individual lines and shuffled randomly.
    // - Ensure only the lines are shuffled, not characters.
    // - Do not give hints or answers.
    // - Make sure the code is reasonably short (5-15 lines) and medium difficulty.`;

   const prompt=` You are a professional technical interviewer.

    Generate exactly ${count} **jumbled-code** questions on the topic: "${topic}", focusing on: ${criteria}.

    Each question must return with the following fields:

    - "question": A clear single-line description of what the code is intended to do, followed by: "Correct it: unshuffle the code."
    - "jumbled_code": An array of lines, where each string is a line from the correct code, but shuffled randomly. Do not shuffle characters.
    - "correct_code": The complete and correct ${criteria} code as a single string with proper formatting (\\n for new lines).

    Strict Guidelines:
    - First generate the correct code based on the topic and the criteria. Then, make an exact copy of this correct code and reorder its lines randomly to form the "jumbled_code". **The content in both the correct_code and jumbled_code must be exactly the same**, with only the order of the lines shuffled. Do **not** remove or add any lines in either version.
    - Code must be **medium in difficulty**, typically between 5 to 15 lines.
    - Each code must be 5-15 lines long (excluding blank lines).
    - The "jumbled_code" must have **one valid reconstruction** to the original code, and must test logical structuring skills.
    - Avoid trivial problems like simple printing, direct assignments, or basic math.
    - The logic and question must be directly related to the topic and reflect the criteria provided (e.g., thread lifecycle understanding).
    - The variables and method names should not be straight forward or trivial; they should make sense in the context of the problem but still require careful consideration when unshuffling.
      
    Do NOT include:
    - Comments
    - Explanations
    - Markdown
    - Blank lines
    - Any other output outside the JSON

    Return exactly ${count} questions as described.
    `;
        


    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'generate medium difficulty' },
      ],
    });

    return response.choices[0]?.message?.content;
  }

  async generateTheoryQuestions(subject: string, topic: string, count: number, criteria: string) {
    // const prompt = `  You are a ${subject} interviewer. Generate ${count} basic conceptual theory questions on ${topic}. 
    // Ask short, theoretical questions related to ${topic}.
    // `;
    // const prompt = `
    // You are an expert ${subject} interviewer designing theory questions for B.Tech Computer Science undergraduate students.
    
    // Your task is to generate exactly ${count} high-quality **conceptual and thought-provoking viva questions** focused on:
    // - Subject: ${subject}
    // - Topic: ${topic}
    // - Criteria/Focus Area: ${criteria}
    
    // **Guidelines for generating questions:**
    // - Mix of **medium and low difficulty**.
    // - The questions should test **logical reasoning** or **deeper understanding** (as per Bloom's Taxonomy: apply, analyze, evaluate).
    // - The questions should encourage **explanation**, **reflection**, or **critical thinking**.
    // - DO NOT generate straightforward questions like "What is ___?" or "Write the abbreviation of ___".
    // - DO NOT repeat or paraphrase similar questions — ensure strict uniqueness.
    // - Questions should help assess the student's **conceptual clarity**, **analytical ability**, and **communication** skills.
    // - No yes/no questions.
    // - No definitions or lists-based questions.
    //  - Return exactly ${count} questions — no more, no less.
    
    // **Return a valid strict JSON array**, each with a single key "question". Do not add any explanation, labels, or commentary.
    
    // **Format:**
    // [
    //   { "question": "..." },
    //   { "question": "..." }
    // ]
    // `;
    const prompt = `
    You are an interviewer designing **theory questions** for B.Tech Computer Science undergraduate students.
    
    Your task is to generate exactly ${count} high-quality **conceptual and thought-provoking theory questions** focused on:
    - Topic: ${topic}
    - Criteria/Focus Area: ${criteria}
    
    **Guidelines for generating questions:**
    - These questions are intended for a **written theory examination**, requiring **clear and concise written responses** — not oral explanations.
    - Mix of **medium and low difficulty**.
    - The questions should test **logical reasoning** or **deeper understanding** (as per Bloom's Taxonomy: apply, analyze, evaluate).
    - Encourage **structured written answers** involving explanation, reasoning, or basic examples/code — not essay-length answers.
    - DO NOT ask for **diagrams**, **flowcharts**, or **drawings**.
    - Avoid **long case-based** or **multi-paragraph analytical** questions that require excessive elaboration.
    - Questions should be **conceptual**, **precise**, and **answerable in a few paragraphs**.
    - DO NOT generate straightforward questions like "What is ___?" or "Write the abbreviation of ___".
    - DO NOT repeat or paraphrase similar questions — ensure strict uniqueness.
    - No yes/no questions.
    - No definition or list-based questions.
    - Ensure questions are **clearly distinct from viva questions** — these must be structured for written exams and not real-time discussion.
    - Return exactly ${count} questions — no more, no less.
    
    **Return a valid strict JSON array**, each with a single key "question". Do not add any explanation, labels, or commentary.
    
    **Format:**
    [
      { "question": "..." },
      { "question": "..." }
    ]
    `;
    

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
     // temperature: 0.8,
      messages: [
        { role: 'system', content: prompt },
        // { role: 'user', content: 'generate medium difficulty' },
      ],
    });

    return response.choices[0]?.message?.content;
  }
}
