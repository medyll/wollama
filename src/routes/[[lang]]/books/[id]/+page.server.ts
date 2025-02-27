import type { EntryGenerator } from "./$types";

export const entries: EntryGenerator = () => {
  return [{ slug: "hello-world" }, { slug: "another-blog-post" }];
};

export const prerender = true;
