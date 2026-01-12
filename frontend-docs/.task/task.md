list_pages: shows list of pages
analyze_page: introduction | architecture | system-flow | flow | integration | api
after analyzing a page should say what the names of the section is with brief short description
read_page: reads the content of a page along with the section that AI wants to read, lets say architecture page section #components, then it will receive the content of the components section of architecture page, now with that content it can answer questions about that section

tool format:
<tool_name>
params here
</tool_name>

after receiving </tool_name> system should abort controller stream and execute the <tool_name></tool_name> and give the result to the AI as user role like: [[[tool_result: result here]]] and it should receive it on the backend do not show it on the frontend only show a tool_block dropdown with the dropdown component is the content of the tool result, then it will iterate on this result and can continue to use tools until it is done