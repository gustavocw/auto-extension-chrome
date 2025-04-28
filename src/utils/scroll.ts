interface ScrollOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  delay?: number;
}

export const smoothScrollTo = (
  element: Element,
  options: ScrollOptions = {}
): Promise<boolean> => {
  if (!element) return Promise.resolve(false);

  const defaultOptions: ScrollOptions = {
    behavior: "smooth",
    block: "center",
    delay: 800,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const originalBackground =
    element.getAttribute("style")?.match(/background-color:[^;]+/)?.[0] || "";
  const originalTransition =
    element.getAttribute("style")?.match(/transition:[^;]+/)?.[0] || "";

  element.setAttribute(
    "style",
    `${
      element.getAttribute("style") || ""
    }; transition: background-color 0.5s ease; background-color: rgba(255, 243, 224, 0.8);`
  );

  element.scrollIntoView({
    behavior: mergedOptions.behavior,
    block: mergedOptions.block,
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      setTimeout(() => {
        let newStyle = element.getAttribute("style") || "";

        newStyle = newStyle
          .replace(
            /background-color:[^;]+;?/,
            originalBackground ? originalBackground + ";" : ""
          )
          .replace(
            /transition:[^;]+;?/,
            originalTransition ? originalTransition + ";" : ""
          );

        element.setAttribute("style", newStyle.trim());
      }, 500);

      resolve(true);
    }, mergedOptions.delay);
  });
};
