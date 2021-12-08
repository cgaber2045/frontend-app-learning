import React, { createContext } from 'react';
import { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import './GlossaryTab.scss';

import messages from './messages';

import {
  DropdownButton,
  Collapsible,
  Button,
  Icon,
  ActionRow,
  SearchField,
  Pagination,
  Form
} from '@edx/paragon';

import { ExpandLess, ExpandMore } from '@edx/paragon/icons';

// Getting all necessary contexts and variables
export const CourseContext = createContext();
export const KeyTermContext = createContext();
const ListViewContext = createContext();
const queryParams = new URLSearchParams(window.location.search);
const scrolltoParam = queryParams.get('scrollTo');
const paginationLength = 15;

// Lists all resources
function ResourceList() {
  const { resources } = useContext(KeyTermContext);
  resources.sort((a, b) => a.friendly_name > b.friendly_name ? 1 : -1)
  if (resources.length > 0) return (
    <div className='ref-container flex-col'>
      <b>References:</b>
      {resources.map(function (resource) {
        return (
          <p>
            <a key={resource.id} target="_blank" rel="noopener noreferrer" href={resource.resource_link}>{resource.friendly_name}</a>
          </p>
        );
      })}
    </div>
  );
  return null;
}

// Lists all lessons
function Lessons() {
  const { lessons } = useContext(KeyTermContext);
  
  // Sorting list by module name then by lesson name
  lessons.sort((a, b) => a.module_name === b.module_name ? (a.lesson_name > b.lesson_name ? 1: -1) : (a.module_name > b.module_name ? 1: -1))
  if (lessons.length > 0) return (
    <div className='lessons-container flex-col'>
      <b>Lessons</b>
      { 
      lessons.map(function (lesson) {
        return (
          <Lesson lesson={lesson} />
        );
      }) 
      }
    </div>
  );

  return null;
}

// Gets a specific textbook
function Lesson({ lesson }) {
  const { courseId } = useContext(CourseContext);
  const encodedCourse = courseId.replace(" ", "+");
  return (
    <p>
      <a key={lesson.id} target="_blank" rel="noopener noreferrer" href={`http://localhost:2000/course/${encodedCourse}/${lesson.lesson_link}`}> {lesson.module_name}&gt;{lesson.lesson_name}&gt;{lesson.unit_name}</a> &nbsp; &nbsp;
    </p>
  );
}

// Gets a specific textbook
function Textbook({ textbook }) {
  const [variant, setVariant] = useState('primary');

  const { courseId } = useContext(CourseContext);
  const assetId = courseId.replace('course', 'asset');

  const lmsTextbookLink = `http://localhost:18000/${assetId}+type@asset+block@${textbook.textbook_link}#page=${textbook.page_num}`;

  return (
    <p>
      <a target="_blank" rel="noopener noreferrer" href={lmsTextbookLink}> {textbook.chapter}, pg. {textbook.page_num} </a>
    </p>
  );
}

// Lists all textbooks
function TextbookList() {
  const { textbooks } = useContext(KeyTermContext);
  if (textbooks.length > 0) return (
    <div className='textbook-container flex-col'>
      <b>Textbooks</b>
      {textbooks.map(function (textbook) {
        return (
          <Textbook key={textbook.id} textbook={textbook} />
        );
      })}
    </div>
  );

  return null;
}

// Lists all definitions
function DefinitionsList() {
  const { definitions } = useContext(KeyTermContext);
  if (definitions.length > 0) return (
    <div className='definitions-container flex-col'>
      <b>Definitions</b>
      {definitions.map(function (descr) {
        return (
          <div className='definition'>
            <p key={descr.id} >{descr.description}</p>
          </div>
        );
      })}
    </div>
  );
  
  return null;
}

// Refers to one key term.
function KeyTerm({index}) {
  const { key_name } = useContext(KeyTermContext);

  return (
    <div className='key-term-container'>
      <Collapsible key={index} style={ index % 2 ? { backgroundColor: "#d4d4d4" }:{ backgroundColor: "white" }} ref={function(ref) {
          if (ref != null && scrolltoParam == key_name) {
            window.scrollTo(0, ref.offsetTop);
            ref.open();
          }
        }}
        title={<b>{key_name}</b>}
        styling='card-lg'
        iconWhenOpen={<Icon src={ExpandLess} />}
        iconWhenClosed={<Icon src={ExpandMore} />}
      >
        <KeyTermData />
      </Collapsible>
    </div>
  );
}

// All the data needed for a keyterm.
function KeyTermData() {
  return (
    <div className='key-term-info'>
      <DefinitionsList />
      <TextbookList />
      <Lessons />
      <ResourceList />
    </div>
  );
}

// Filter modules button
function ModuleDropdown(termData) {
  const { filterModules, setFilterModules } = useContext(ListViewContext);
  var lessons = []
  var newSet = new Set()

  termData["value"]["termData"].filter(function (keyTerm) {
    keyTerm.lessons.forEach(lesson => {
      if (lessons.find(function(object) {return object.module_name === lesson.module_name}) === undefined) lessons.push(lesson)
    });
  })

  lessons.sort((a, b) => a.module_name > b.module_name ? 1 : -1)

  const handleChange = e => {
    filterModules.forEach(item => {newSet.add(item)});
    e.target.checked ? newSet.add(e.target.value) : newSet.delete(e.target.value);
    setFilterModules(newSet);
  }

  var buttontitle = filterModules.size > 0 ? `Filter Modules (${filterModules.size})` : "Filter Modules";
  return (
    <DropdownButton id="dropdown-basic-button" title={buttontitle}>
      <Form.Group>
        <Form.CheckboxSet name="modules" onChange={handleChange}>
        {lessons.map(lesson => <Form.Checkbox value={lesson.module_name}>{lesson.module_name}</Form.Checkbox>)}
        </Form.CheckboxSet>
      </Form.Group>
    </DropdownButton>
  )
}

// Lists all keyterms
function KeyTermList() {
  const { filterModules, searchQuery, selectedPage, setPagination } = useContext(ListViewContext);
  const { termData } = useContext(CourseContext);

  function paginate(termList, page_size, page_number) {
    return termList.slice((page_number - 1) * page_size, page_number * page_size);
  }
    
  const displayTerms = termData
    .filter(function (keyTerm) {
      // Displaying filtered keyterms
      if (filterModules.size == 0 || keyTerm.lessons.find(function(object) {return filterModules.has(object.module_name)}) !== undefined)
        // Returns keyterms with names or definitions matching search query
        return keyTerm.key_name.toString().toLowerCase().includes(searchQuery.toLowerCase()) || 
          keyTerm.definitions.find(function(object) {return object.description.toLowerCase().includes(searchQuery.toLowerCase())}) !== undefined;
    })
    .sort(function compare(a, b) {
      if (a.key_name < b.key_name) return -1;
      if (a.key_name > b.key_name) return 1;
      return 0;
    });
  
  setPagination(displayTerms.length / paginationLength);
  if (displayTerms.length === 0) setPagination(0);

  return (
    <div className='key-term_list'>
      {displayTerms.length === 0 ? (<h3 className='filter-container'>No Terms to Display...</h3>) : null}
      {paginate(displayTerms, paginationLength, selectedPage).map((keyTerm, index)=> {
      return (
        <KeyTermContext.Provider value={keyTerm}>
          <KeyTerm index={index} key={displayTerms.id} />
        </KeyTermContext.Provider>
      );
      })}
    </div>
  );
}

// Refers to the whole glossary page
function GlossaryTab({ intl }) {
  const { courseId } = useSelector(state => state.courseHome);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModules, setFilterModules] = useState(new Set());
  const [termData, setTermData] = useState([]);
  const [selectedPage, setSelectedPage] = useState(1);
  const [pagination, setPagination] = useState();
  const [expandAll, setExpandAll] = useState(false);

  // Fetch data from edx_keyterms_api
  const getTerms=()=> {
    const encodedCourse = courseId.replace(" ", "+");
    const restUrl = `http://localhost:18500/api/v1/course_terms?course_id=${encodedCourse}`;
    fetch(restUrl, {
      method: "GET"
    })
    .then((response) => response.json())
    .then((jsonData) => setTermData(jsonData))
    .catch((error) => {
      console.error(error);
    });
  }

  useEffect(()=>{
    getTerms();
  },[]);

  return (
    <>
      {/* Header */}
      <div role="heading" aria-level="1" className="h2 my-3">
        {intl.formatMessage(messages.glossaryHeader)}
      </div>

      {/* Search Functions */}
      <ActionRow>
        {
        <p>
          Displaying {pagination > 0 ? 1 + paginationLength * (selectedPage - 1) : 0}
                      -
                      {pagination * paginationLength < paginationLength
                        ? parseInt(pagination * paginationLength)
                        : paginationLength * selectedPage}{' '}
                      of {parseInt(pagination * paginationLength)} items
        </p>
        }
        <ActionRow.Spacer />
        
        <SearchField
                    onSubmit={(value) => {
                      setSearchQuery(value);
                    }}
                    onClear={() => setSearchQuery("")
                    }
                    placeholder='Search'
        />
        <ListViewContext.Provider value = {{filterModules, setFilterModules}}>
          <ModuleDropdown value={{termData}}/>
        </ListViewContext.Provider>
      </ActionRow>
      
      {/* List of Key Terms */}
      <CourseContext.Provider value={{ courseId, termData, setTermData }}>
        <ListViewContext.Provider value = {{filterModules, setFilterModules, setPagination, searchQuery, selectedPage, expandAll, setExpandAll}}>
            <KeyTermList /> 
        </ListViewContext.Provider>
      
      {
        <div className='footer-container'>
          {pagination === 0 ? null : (
            <Pagination
              paginationLabel='pagination navigation'
              pageCount={
                pagination > parseInt(pagination)
                  ? parseInt(pagination) + 1
                  : pagination
              }
              onPageSelect={(value) => setSelectedPage(value)}
            />
          )}
        </div>
      }
      </CourseContext.Provider>
      
    </>
  );
}

GlossaryTab.propTypes = {
  intl: intlShape.isRequired,
};

export default injectIntl(GlossaryTab);