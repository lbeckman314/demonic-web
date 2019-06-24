---
title: Demo CodeMirror Demonstration
---

This is a demonstration of the [demo](https://github.com/lbeckman314/demo) project, specifically by running code snippets from a markdown-converted document.

demo was inspired by [mdbook](https://github.com/rust-lang-nursery/mdBook), which is a great Rust documentation project. In mdbook, you can edit and run Rust code right from the document (e.g. [*Testcase: map-reduce*](https://doc.rust-lang.org/rust-by-example/std_misc/threads/testcase_mapreduce.html#testcase-map-reduce)! I really liked this feature, but wanted to be able to send input back to the running process.

You can even edit this page's source and compile a whole new document! Give it a go by selecting the 'Edit Source' button and then clicking the '▶' button below [Source](#source).

<button id="edit-source">Edit Source</button>

## Python

```python
def greet():
    name = input('Enter your name: ')
    print('Hello', name)

def main():
    greet()

main()
```

## C

```c
#include <stdio.h>

int main() {
    fprintf(stderr, "%s", "Enter your name: ");
    char name[100];
    scanf("%s", name);

    fprintf(stderr, "Hello %s!\n", name);
    return 0;
}
```

## Support and Roadmap

This project aims to allow unmodified markdown files to have editable and runnable code blocks. But there needs to be a way for users to tell which program blocks they want to run and which they don't. Unfortunately, this requires a modification to the markdown files! In this instance, the following markdown code had a ".norun" class addition, which tells demo not to add a "▶" button to the code block.

```{.markdown .norun}
    ```{.python .norun}
    print("Don't run me!")
    ```
```

```{.python .norun}
print("Don't run me!")
```

Markdown files converted by [Pandoc](https://pandoc.org/) are the only supported format currently, but I'd like to add lots of others! I'd like to add the following features:

- Add more documentation. This is a documentation project at heart!
- Adding more languages! This should be forthcoming. Stay tuned!
- Being able to make code blocks "non-runnable" by default.
- Compiling/running multiple files. This may include using the [multiple buffer functionality](https://codemirror.net/demo/buffers.html) of CodeMirror.
- Jekyll-converted markdown documents.
- Org-mode HTML-ized documents.
- Mdbook-converted markdown documents.
- Import/export ability.
- Being able to switch modes for each buffer. This should be made a little easier by CodeMirror's [ability](https://codemirror.net/demo/changemode.html) to do just that.
- Having the option to run the code block converter from the command line i.e. not only at "runtime" as it currently does).
- Having the option to choose between [CodeMirror](https://codemirror.net/) and [Ace](https://ace.c9.io/) for the online editors.
- If you have any other suggestions, let me know at [this](https://github.com/lbeckman314/demo/issues) issue reporter or by e-mail. I'm available at [liam@liambeckman.com](mailto:liam@liambeckman.com) : )

Adding support requires playing around with the resulting DOM structure of each converter and file type, and being able to extract the `language` and `code` of each code block.
