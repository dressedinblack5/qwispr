// vitepress config — qwispr docs site
export default {
  title: "qwispr",
  description: "hybrid quantum/classical code intelligence",
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Commands", link: "/commands" },
      { text: "Benchmarks", link: "/benchmarks" },
      { text: "Learning", link: "/learning" },
    ],
    sidebar: [
      { text: "Home", link: "/" },
      { text: "Commands", link: "/commands" },
      { text: "Benchmarks", link: "/benchmarks" },
      { text: "Learning", link: "/learning" },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/quantna/qwispr" }],
  },
};
