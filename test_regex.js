const text = "...grado [cite:art_155_lo12_4_2263]Artículo 155 del Código Penal[/cite].";
const regex = /(\[cite:[^\]]+\](?:[\s\S]+?)\[\/cite\])/g;
const parts = text.split(regex);
console.log("Parts:", parts);

const part = "[cite:art_155_lo12_4_2263]Artículo 155 del Código Penal[/cite]";
const match = part.match(/^\[cite:([^\]]+)\]([\s\S]+?)\[\/cite\]$/);
console.log("Match:", match ? "Yes" : "No");
if (match) {
    console.log("Key:", match[1]);
    console.log("Display:", match[2]);
}
