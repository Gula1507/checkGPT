export default [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                localStorage: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                MutationObserver: "readonly",
                CustomEvent: "readonly",
                chrome: "readonly",
                global: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    }
];
