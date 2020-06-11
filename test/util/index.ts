import  JsonToTS from "../../src/index";
export const removeWhiteSpace = str => str.replace(/\s/g, '')

export const JsonToJSDoc = (json) => {
  return JsonToTS(json, {
    isUseJSDoc: true
  })
}