import { RobulaPlus } from "px-robula-plus"
import { Result } from "ts-results"
import { wrapResult } from './control-flow'

const robulaClient = new RobulaPlus()

export function getXPath (element: Element): Result<string, Error> {
  return wrapResult(() => robulaClient.getRobustXPath(element, document))
}

export function getElementByXPath (xpath: string) {
  return robulaClient.getElementByXPath(xpath, document) as HTMLElement
}


