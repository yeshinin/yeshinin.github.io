// Sketches shown in the Sketches folders. To add one: put the image in
// images/sketches/ and add a line under the right folder.
const post = (id) => `https://www.instagram.com/p/${id}/`;
const img = (id, caption) => ({ src: `images/sketches/${id}.jpg`, caption, link: post(id) });

window.SKETCHES = [
  { name: "Paintings", images: [img("DYmjnLTE4zk", "Sabzi mandi")] },
  {
    name: "In location sketch",
    list: true,
    children: [
      {
        name: "Seattle",
        images: [
          img("DWsf6kIFdu1", "Wooden boathouse, South Lake Union"),
          img("DVp2aRQlX_8", "Anchorhead Coffee"),
          img("DTZfKXuEQEP", "Olympia Coffee"),
        ],
      },
      { name: "Hawaii", images: [img("DU2TQNxEXC3", "Akaka Falls"), img("DUm7u6MkRI8", "On the way to Mauna Kea")] },
      { name: "New York", images: [img("DVKhcaYkU1n", "The Met")] },
    ],
  },
];
