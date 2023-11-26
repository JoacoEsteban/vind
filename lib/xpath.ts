import { RobulaPlus } from "px-robula-plus"

const robulaClient = new RobulaPlus()

export function getXPath (element: Element) {
  return robulaClient.getRobustXPath(element, document)
}

export function getElementByXPath (xpath: string) {
  return robulaClient.getElementByXPath(xpath, document) as HTMLElement
}


