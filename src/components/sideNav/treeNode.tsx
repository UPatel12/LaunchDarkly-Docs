/** @jsx jsx */
import { jsx, useThemeUI, Flex, Link as ThemeUILink } from 'theme-ui'
import { FunctionComponent, useState } from 'react'
import { Link as GatsbyLink } from 'gatsby'
import { useFlags } from 'gatsby-plugin-launchdarkly'
import { globalHistory } from '@reach/router'
import { SideNavItem } from './types'
import isExternalLink from '../../utils/isExternalLink'
import Icon, { IconName } from '../icon'

type TreeNodeProps = {
  nodes: Array<SideNavItem>
  maxDepth?: number
  depth?: number
}

enum ExpandCollapseEnum {
  Collapsed,
  Expanded,
}

const defaultLabelStyles = {
  color: 'grayBlack',
  fontSize: 4,
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  ':hover': {
    color: 'primarySafe',
    '& svg': {
      fill: 'primarySafe',
    },
  },
  ':active': {
    color: 'grayBlack',
  },
  lineHeight: 'regular',
}
const maxDepthLabelStyles = {
  ...defaultLabelStyles,
  fontSize: 3,
  lineHeight: 'small',
}

const defaultListItemStyles = { mt: 4, ml: 5 }
const rootListItemStyles = { mt: 5, mr: 2, ml: 6 }

// Hamburger maxDepth is 3 since root topics are displayed.
// Desktop sideNav maxDepth is 2 since root topics are displayed in the top nav.
const TreeNode: FunctionComponent<TreeNodeProps> = ({ nodes, maxDepth = 2, depth = 0 }) => {
  const isRootNode = depth === 0
  const isMaxDepth = depth === maxDepth

  const flags = useFlags()

  // Detect if this tree node has ever been expanded/collapsed
  const [isPristine, setIsPristine] = useState(true)

  // use local state to manage expand/collapse states on menu item clicks
  const initialState: ExpandCollapseEnum[] = nodes.map(() => ExpandCollapseEnum.Collapsed)
  const [expandCollapseStates, setState] = useState(initialState)

  const { theme } = useThemeUI()
  const setActiveStyles = ({ isCurrent, isPartiallyCurrent }: { isCurrent: boolean; isPartiallyCurrent: boolean }) => {
    if (isCurrent) {
      return { style: { color: theme.colors.primarySafe, fontWeight: theme.fontWeights.bold } }
    } else if (isPartiallyCurrent) {
      return { style: { fontWeight: theme.fontWeights.bold } }
    }
    // use defaultLabelStyles specified at the Link depth below
    return null
  }

  const onExpandCollapse = (isLeafNode: boolean, index: number) => {
    if (!isLeafNode) {
      setState(prevState => {
        const clone = [...prevState]
        clone[index] =
          clone[index] === ExpandCollapseEnum.Collapsed ? ExpandCollapseEnum.Expanded : ExpandCollapseEnum.Collapsed
        return clone
      })
    }
  }

  return (
    <ul sx={{ fontWeight: 'body' }}>
      {nodes.map((node, index) => {
        const { label, path, svg, flagKey, items } = node
        const nodeChildrenCount = items?.length ?? 0
        const isLeafNode = nodeChildrenCount === 0
        const partiallyActive = globalHistory.location.pathname.includes(path)
        const listItemStyles = isRootNode ? rootListItemStyles : defaultListItemStyles
        const labelStyles = isMaxDepth ? maxDepthLabelStyles : defaultLabelStyles

        if (isPristine && partiallyActive && expandCollapseStates[index] === ExpandCollapseEnum.Collapsed) {
          setIsPristine(false)
          setState(prevState => {
            const clone = [...prevState]
            clone[index] = ExpandCollapseEnum.Expanded
            return clone
          })
        }
        const expandedCollapsed = expandCollapseStates[index]
        const showItem = flagKey ? flags[flagKey] : true
        return showItem ? (
          <li key={`${label}-${index}`} sx={listItemStyles}>
            {isExternalLink(path) ? (
              <ThemeUILink href={path} sx={labelStyles} target="_blank" rel="noopener noreferrer">
                {label}
                {svg && <Icon name={svg as IconName} height="0.8rem" fill="grayDark" ml={1} />}
              </ThemeUILink>
            ) : (
              <Flex>
                <GatsbyLink
                  getProps={setActiveStyles}
                  sx={labelStyles}
                  to={path}
                  onClick={() => onExpandCollapse(isLeafNode, index)}
                >
                  <Flex sx={{ alignItems: 'center' }}>
                    {svg && <Icon name={svg as IconName} height="1rem" fill="grayDark" mr={2} />}
                    {label}
                  </Flex>
                </GatsbyLink>
                {!isLeafNode && (
                  <Icon
                    name={expandedCollapsed === ExpandCollapseEnum.Collapsed ? 'arrow-down' : 'arrow-up'}
                    onClick={() => onExpandCollapse(isLeafNode, index)}
                    variant="sideNav"
                    fill="grayBase"
                    ml={2}
                  />
                )}
              </Flex>
            )}
            {isLeafNode || expandedCollapsed === ExpandCollapseEnum.Collapsed ? null : (
              <TreeNode nodes={items} depth={depth + 1} maxDepth={maxDepth} />
            )}
          </li>
        ) : null
      })}
    </ul>
  )
}

export default TreeNode
