// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "thirdweb SDK",
  tagline:
    "Typescript SDK for deploying and interacting with thirdweb contracts",
  url: "https://typescript-docs.thirdweb.com",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "thidweb-dev", // Usually your GitHub org/user name.
  projectName: "typescript-sdk", // Usually your repo name.
  trailingSlash: false,

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        // title: "thirdweb SDK",
        logo: {
          alt: "thirdweb SDK",
          src: "img/thirdweb.png",
          href: "/",
          srcDark: "img/thirdweb-white.png",
        },
        items: [
          // {
          //   type: "doc",
          //   docId: "sdk",
          //   position: "left",
          //   label: "Documentation",
          // },
          {
            href: "https://portal.thirdweb.com",
            label: "Guides",
            position: "left",
          },
          {
            href: "https://blog.thirdweb.com",
            label: "Blog",
            position: "left",
          },
          {
            href: "https://github.com/thirdweb-dev/typescript-sdk",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "light",
        links: [
          // {
          //   title: "Docs",
          //   items: [
          //     {
          //       label: "Tutorial",
          //       to: "/docs/intro",
          //     },
          //   ],
          // },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://discord.gg/thirdweb",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/thirdweb_",
              },
              {
                label: "GitHub",
                href: "https://github.com/thirdweb-dev/typescript-sdk",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Dashboard",
                href: "https://thirdweb.com/dashboard",
              },
              {
                label: "Blog",
                href: "https://blog.thirdweb.com",
              },
              {
                label: "Guides",
                href: "https://portal.thirdweb.com",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} thirdweb, Inc.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
  // plugins: [
  //   [
  //     "docusaurus-plugin-typedoc",
  //     // Plugin / TypeDoc options
  //     {
  //       entryPoints: ["../src/index.ts"],
  //       tsconfig: "../tsconfig.json",
  //       excludeExternals: true,
  //       excludePrivate: true,
  //       excludeProtected: true,
  //       excludeInternal: true,
  //       out: "./api",
  //     },
  //   ],
  // ],
};

module.exports = config;
