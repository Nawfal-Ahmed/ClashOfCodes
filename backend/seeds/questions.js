export const questions = [
  {
    title: "Two Sum",

    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",

    difficulty: "Easy",

    topics: ["Arrays", "Hashing"],

    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "nums[0] + nums[1] = 9",
      },
    ],

    constraints: [
      "2 <= nums.length <= 10^4",
    ],

    starterCode: {
      javascript:
`function twoSum(nums, target) {

}`,
      python:
`def two_sum(nums, target):
    pass`,
    },

    testCases: [
      {
        input: "[2,7,11,15]\n9",
        output: "[0,1]",
        isHidden: false,
      },
      {
        input: "[3,2,4]\n6",
        output: "[1,2]",
        isHidden: true,
      },
    ],
  },

  {
    title: "Valid Parentheses",

    description:
      "Determine if the input string of brackets is valid.",

    difficulty: "Easy",

    topics: ["Stack"],

    examples: [
      {
        input: "()[]{}",
        output: "true",
      },
    ],

    constraints: [
      "1 <= s.length <= 10^4",
    ],

    starterCode: {
      javascript:
`function isValid(s) {

}`,
    },

    testCases: [
      {
        input: "()[]{}",
        output: "true",
        isHidden: false,
      },
      {
        input: "(]",
        output: "false",
        isHidden: true,
      },
    ],
  },

  {
    title: "Binary Search",

    description:
      "Given a sorted array and target, return its index.",

    difficulty: "Easy",

    topics: ["Binary Search"],

    examples: [
      {
        input: "nums=[-1,0,3,5,9,12], target=9",
        output: "4",
      },
    ],

    constraints: [
      "1 <= nums.length <= 10^4",
    ],

    starterCode: {
      javascript:
`function search(nums, target) {

}`,
    },

    testCases: [
      {
        input: "-1 0 3 5 9 12\n9",
        output: "4",
        isHidden: false,
      },
    ],
  },
];