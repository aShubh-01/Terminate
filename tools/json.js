exports.extract = async ({ text }) => {

  if (!text) return null

  let str = String(text)

  /* remove escaped newlines */
  str = str.replace(/\\n/g, "")

  /* find first JSON block using brace depth */
  let start = -1
  let depth = 0

  for (let i = 0; i < str.length; i++) {

    if (str[i] === "{") {

      if (depth === 0) start = i
      depth++

    }

    else if (str[i] === "}") {

      depth--

      if (depth === 0 && start !== -1) {

        const jsonCandidate = str.slice(start, i + 1)

        try {
          return JSON.parse(jsonCandidate)
        } catch {
          break
        }

      }

    }

  }

  return null

}