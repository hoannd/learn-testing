import * as assert from "assert";
import { BeforeScenario, Step, Table } from "gauge-ts";

const vowels = ["a", "e", "i", "o", "u"];

function numberOfVowels(word: string): number {
    return word.split("").filter(elem => vowels.includes(elem)).length;
}

export default class StepImplementation {
    @Step("Vowels in English language are <vowels>.")
    public async vowelsGiven(vowelsGiven: string) {
        assert.equal(vowelsGiven, vowels.join(""));
    }

    @Step("The word <word> has <number> vowels.")
    public async wordHasVowels(word: string, number: number) {
        assert.equal(number, numberOfVowels(word));
    }

    @Step("Almost all words have vowels <table>")
    public async wordsHaveVowels(table: Table) {
        for (const row of table.getTableRows()) {
            assert.equal(numberOfVowels(row.getCell("Word")), parseInt(row.getCell("Vowel Count")));
        }
    }

    @BeforeScenario()
    public async beforeScenarioAll() {
        assert.equal(vowels.join(""), "aeiou");
    }

    @BeforeScenario({ tags: ["single word"] })
    public async beforeScenarioSingleWord() {
        assert.equal(vowels[0], "a");
    }
}
