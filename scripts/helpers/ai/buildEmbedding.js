const fs = require("fs")
const { pipeline } = require("@xenova/transformers")
const dataset = require("./dataset")

async function build() {

  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/bge-small-en-v1.5"
  )

  const vectors = []

  for (const item of dataset) {

    const out = await embedder(item.text, {
      pooling: "mean",
      normalize: true
    })

    vectors.push({
      label: item.label,
      vector: Array.from(out.data)
    })

  }

  fs.writeFileSync(
    "./dataset_vectors.json",
    JSON.stringify(vectors)
  )
}

build()