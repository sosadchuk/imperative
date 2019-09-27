/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

node('ubuntu1804-docker-2c-2g') {
    docker.image('markackertca/zowe-base:wip').inside() {
        def lib = library("jenkins-library@user/markackert/oss-updates").org.zowe.jenkins_shared_library;
        // Initialize the pipeline
        def pipeline = lib.pipelines.nodejs.NodeJSPipeline.new(this)

        // Build admins, users that can approve the build and receieve emails for 
        // all protected branch builds.
        pipeline.admins.add("markackert")

        // Comma-separated list of emails that should receive notifications about these builds
        // pipeline.emailList = "mark.ackert@broadcom.com"

        // Protected branch property definitions
        pipeline.branches.addMap([
            [name: "master", npmTag: "latest", allowRelease: true, allowFormalRelease: true, isProtected: true],
            [name: "lts-incremental", npmTag: "lts-incremental", allowRelease: true, allowFormalRelease: true, isProtected: true],
            [name: "lts-stable", npmTag: "lts-stable", allowRelease: true, allowFormalRelease: true, isProtected: true]
        ]);
   
        // Initialize the pipeline library, should create 5 steps
        pipeline.setup(
            github: [
                email                      : lib.Constants.DEFAULT_GITHUB_ROBOT_EMAIL,
                usernamePasswordCredential : lib.Constants.DEFAULT_LFJ_GITHUB_ROBOT_CREDENTIAL,
            ],
            artifactory: [
                url                        : lib.Constants.DEFAULT_LFJ_ARTIFACTORY_URL,
                usernamePasswordCredential : lib.Constants.DEFAULT_LFJ_ARTIFACTORY_ROBOT_CREDENTIAL,
            ]
        );

        // Create a custom lint stage that runs immediately after the setup.
        pipeline.createStage(
            name: "Lint",
            stage: {
                sh "npm run lint"
            },
            timeout: [
                time: 2,
                unit: 'MINUTES'
            ]
        )

        // Build the application
        pipeline.build(
            timeout: [
                time: 5,
                unit: 'MINUTES'
            ]
        )


        def TEST_ROOT = "__tests__/__results__/ci"
        def UNIT_TEST_ROOT = "$TEST_ROOT/unit"
        def UNIT_JUNIT_OUTPUT = "$UNIT_TEST_ROOT/junit.xml"
        
        // Perform a unit test and capture the results
        pipeline.test(
            name: "Unit",
            operation: {
                sh "npm run test:unit"
            },
            environment: [
                JEST_JUNIT_OUTPUT: UNIT_JUNIT_OUTPUT,
                JEST_STARE_RESULT_DIR: "${UNIT_TEST_ROOT}/jest-stare",
                JEST_STARE_RESULT_HTML: "index.html"
            ],
            testResults: [dir: "${UNIT_TEST_ROOT}/jest-stare", files: "index.html", name: 'Imperative - Unit Test Report'],
            coverageResults: [dir: "__tests__/__results__/unit/coverage/lcov-report", files: "index.html", name: 'Imperative - Unit Test Coverage Report'],
            junitOutput: UNIT_JUNIT_OUTPUT,
            cobertura: [
                autoUpdateHealth: false,
                autoUpdateStability: false,
                coberturaReportFile: '__tests__/__results__/unit/coverage/cobertura-coverage.xml',
                conditionalCoverageTargets: '70, 0, 0',
                failUnhealthy: false,
                failUnstable: false,
                lineCoverageTargets: '80, 0, 0',
                maxNumberOfBuilds: 20,
                methodCoverageTargets: '80, 0, 0',
                onlyStable: false,
                sourceEncoding: 'ASCII',
                zoomCoverageChart: false
            ]
        )

        // Perform an integration test and capture the results
        def INTEGRATION_TEST_ROOT = "$TEST_ROOT/integration"
        def INTEGRATION_JUNIT_OUTPUT = "$INTEGRATION_TEST_ROOT/junit.xml"
        
        pipeline.test(
            name: "Integration",
            operation: {
                sh "npm run test:integration"
            },
            timeout: [time: 30, unit: 'MINUTES'],
            shouldUnlockKeyring: true,
            environment: [
                JEST_JUNIT_OUTPUT: INTEGRATION_JUNIT_OUTPUT,
                JEST_STARE_RESULT_DIR: "${INTEGRATION_TEST_ROOT}/jest-stare",
                JEST_STARE_RESULT_HTML: "index.html"
            ],
            testResults: [dir: "$INTEGRATION_TEST_ROOT/jest-stare", files: "index.html", name: 'Imperative - Integration Test Report'],
            junitOutput: INTEGRATION_JUNIT_OUTPUT
        )

        // Check vulnerabilities
        //  pipeline.checkVulnerabilities()

        // Deploys the application if on a protected branch. Give the version input
        // 30 minutes before an auto timeout approve.
        pipeline.publish();

        def logLocation = "__tests__/__results__"
        // Once called, no stages can be added and all added stages will be executed. On completion
        // appropriate emails will be sent out by the shared library.
        pipeline.end()
    }
}
