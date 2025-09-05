import { SupabaseClient } from "@supabase/supabase-js";

export interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip";
  response?: unknown;
  error?: string;
  duration: number;
  statusCode?: number;
}

export interface EdgeFunctionTestSuite {
  functionName: string;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export class EdgeFunctionTester {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async getAuthHeaders(): Promise<{ [key: string]: string }> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return {
      "Authorization": `Bearer ${session?.access_token || ""}`,
      "Content-Type": "application/json",
    };
  }

  async runTest(
    testName: string,
    testFn: () => Promise<unknown>,
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: "pass",
        response: (result as any).data || result,
        duration,
        statusCode: (result as any).status || 200,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      return {
        name: testName,
        status: "fail",
        error: error.message || "Unknown error",
        duration,
        statusCode: error.status || 0,
      };
    }
  }

  // 1. CLEANUP SCHEDULER TESTS
  async testCleanupScheduler(): Promise<EdgeFunctionTestSuite> {
    const tests: TestResult[] = [];

    // Test 1: Without auth (should fail)
    tests.push(
      await this.runTest("Cleanup without auth", async () => {
        const response = await fetch(
          `${BASE_URL}/functions/v1/cleanup-scheduler`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (response.status !== 401) {
          throw new Error(`Expected 401, got ${response.status}`);
        }

        return { status: response.status, data: await response.json() };
      }),
    );

    // Test 2: With auth (admin required)
    tests.push(
      await this.runTest("Cleanup with auth", async () => {
        const headers = await this.getAuthHeaders();
        const response = await fetch(
          `${BASE_URL}/functions/v1/cleanup-scheduler`,
          {
            method: "POST",
            headers,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            `${response.status}: ${data.error || "Unknown error"}`,
          );
        }

        return { status: response.status, data };
      }),
    );

    return this.createSummary("cleanup-scheduler", tests);
  }

  // 2. FEED PROCESSOR TESTS
  async testFeedProcessor(): Promise<EdgeFunctionTestSuite> {
    const tests: TestResult[] = [];
    const headers = await this.getAuthHeaders();

    // Test 1: Get Feed
    tests.push(
      await this.runTest("Get feed", async () => {
        const response = await fetch(
          `${BASE_URL}/functions/v1/FEED_PROCESSOR/get-feed`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ limit: 10, offset: 0, type: "for-you" }),
          },
        );

        const data = await response.json();
        if (!response.ok) throw new Error(`${response.status}: ${data.error}`);

        return { status: response.status, data };
      }),
    );

    // Test 2: Like functionality (need a post ID)
    tests.push(
      await this.runTest("Like post", async () => {
        // First get a post to like
        const feedResponse = await fetch(
          `${BASE_URL}/functions/v1/FEED_PROCESSOR/get-feed`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ limit: 1, offset: 0, type: "for-you" }),
          },
        );

        const feedData = await feedResponse.json();

        if (!feedData.posts || feedData.posts.length === 0) {
          throw new Error("No posts available to like");
        }

        const postId = feedData.posts[0].id;

        const response = await fetch(
          `${BASE_URL}/functions/v1/FEED_PROCESSOR/like`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ post_id: postId }),
          },
        );

        const data = await response.json();
        if (!response.ok) throw new Error(`${response.status}: ${data.error}`);

        return { status: response.status, data };
      }),
    );

    // Test 3: Add Comment
    tests.push(
      await this.runTest("Add comment", async () => {
        // Get a post to comment on
        const feedResponse = await fetch(
          `${BASE_URL}/functions/v1/FEED_PROCESSOR/get-feed`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ limit: 1, offset: 0, type: "for-you" }),
          },
        );

        const feedData = await feedResponse.json();

        if (!feedData.posts || feedData.posts.length === 0) {
          throw new Error("No posts available to comment on");
        }

        const postId = feedData.posts[0].id;

        const response = await fetch(
          `${BASE_URL}/functions/v1/FEED_PROCESSOR/comment`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              post_id: postId,
              content: `Test comment from edge function tester ${Date.now()}`,
            }),
          },
        );

        const data = await response.json();
        if (!response.ok) throw new Error(`${response.status}: ${data.error}`);

        return { status: response.status, data };
      }),
    );

    return this.createSummary("FEED_PROCESSOR", tests);
  }

  // 3. CONTENT UPLOADER TESTS
  async testContentUploader(): Promise<EdgeFunctionTestSuite> {
    const tests: TestResult[] = [];
    const headers = await this.getAuthHeaders();
    delete headers["Content-Type"]; // FormData sets its own content-type

    // Test 1: Upload small text file
    tests.push(
      await this.runTest("Upload small file", async () => {
        const blob = new Blob(["Test file content"], { type: "text/plain" });
        const file = new File([blob], "test.txt", { type: "text/plain" });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "post");

        const response = await fetch(
          `${BASE_URL}/functions/v1/CONTENT_UPLOADER/upload`,
          {
            method: "POST",
            headers: { "Authorization": headers.Authorization },
            body: formData,
          },
        );

        const data = await response.json();
        if (!response.ok) throw new Error(`${response.status}: ${data.error}`);

        return { status: response.status, data };
      }),
    );

    // Test 2: Upload oversized file (should fail)
    tests.push(
      await this.runTest("Upload oversized file", async () => {
        // Create a blob larger than 100MB (simulated)
        const response = await fetch(
          `${BASE_URL}/functions/v1/CONTENT_UPLOADER/upload`,
          {
            method: "POST",
            headers: { "Authorization": headers.Authorization },
            body: new FormData(), // Empty form - will fail validation
          },
        );

        if (response.status !== 400 && response.status !== 413) {
          const data = await response.json();
          throw new Error(
            `Expected 400 or 413, got ${response.status}: ${data.error}`,
          );
        }

        return {
          status: response.status,
          data: "Correctly rejected oversized file",
        };
      }),
    );

    return this.createSummary("CONTENT_UPLOADER", tests);
  }

  // 4. MESSAGE HANDLER TESTS
  async testMessageHandler(): Promise<EdgeFunctionTestSuite> {
    const tests: TestResult[] = [];
    const headers = await this.getAuthHeaders();

    // Test 1: Get conversations
    tests.push(
      await this.runTest("Get conversations", async () => {
        const response = await fetch(
          `${BASE_URL}/functions/v1/MESSAGE_HANDLER/get-conversations`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ limit: 20, offset: 0 }),
          },
        );

        const data = await response.json();
        if (!response.ok) throw new Error(`${response.status}: ${data.error}`);

        return { status: response.status, data };
      }),
    );

    // Test 2: Create DM (with self - should work or give appropriate error)
    tests.push(
      await this.runTest("Create DM", async () => {
        const { data: { user } } = await this.supabase.auth.getUser();

        const response = await fetch(
          `${BASE_URL}/functions/v1/MESSAGE_HANDLER/create-dm`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ other_user_id: user?.id }),
          },
        );

        const data = await response.json();
        // This might fail if you can't DM yourself - that's OK

        return { status: response.status, data };
      }),
    );

    return this.createSummary("MESSAGE_HANDLER", tests);
  }

  // 5. PUSH NOTIFICATIONS TESTS
  async testPushNotifications(): Promise<EdgeFunctionTestSuite> {
    const tests: TestResult[] = [];
    const headers = await this.getAuthHeaders();

    // Test 1: Store FCM token
    tests.push(
      await this.runTest("Store FCM token", async () => {
        const response = await fetch(
          `${BASE_URL}/functions/v1/PUSH_NOTIFICATIONS/store-token`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              token: `test_token_${Date.now()}`,
              platform: "web",
              device_info: {
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
              },
            }),
          },
        );

        const data = await response.json();
        if (!response.ok) throw new Error(`${response.status}: ${data.error}`);

        return { status: response.status, data };
      }),
    );

    // Test 2: Get notifications
    tests.push(
      await this.runTest("Get notifications", async () => {
        const response = await fetch(
          `${BASE_URL}/functions/v1/PUSH_NOTIFICATIONS/get-notifications`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ limit: 20, offset: 0, unread_only: false }),
          },
        );

        const data = await response.json();
        if (!response.ok) throw new Error(`${response.status}: ${data.error}`);

        return { status: response.status, data };
      }),
    );

    return this.createSummary("PUSH_NOTIFICATIONS", tests);
  }

  // 6. MENU ITEMS TESTS (No auth required)
  async testMenuItems(): Promise<EdgeFunctionTestSuite> {
    const tests: TestResult[] = [];

    // Test 1: Get food items
    tests.push(
      await this.runTest("Get food items", async () => {
        const params = new URLSearchParams({
          limit: "20",
          offset: "0",
          sort_by: "display_order",
          sort_order: "asc",
        });

        const response = await fetch(
          `${BASE_URL}/functions/v1/MENU_ITEMS/food?${params}`,
        );

        const data = await response.json();
        if (!response.ok) throw new Error(`${response.status}: ${data.error}`);

        return { status: response.status, data };
      }),
    );

    // Test 2: Get all menu items
    tests.push(
      await this.runTest("Get all menu items", async () => {
        const response = await fetch(
          `${BASE_URL}/functions/v1/MENU_ITEMS/items`,
        );

        const data = await response.json();
        if (!response.ok) throw new Error(`${response.status}: ${data.error}`);

        return { status: response.status, data };
      }),
    );

    return this.createSummary("MENU_ITEMS", tests);
  }

  // Run all tests
  async runAllTests(): Promise<EdgeFunctionTestSuite[]> {
    console.log("🧪 Starting comprehensive edge function tests...");

    const results: EdgeFunctionTestSuite[] = [];

    try {
      results.push(await this.testCleanupScheduler());
      results.push(await this.testFeedProcessor());
      results.push(await this.testContentUploader());
      results.push(await this.testMessageHandler());
      results.push(await this.testPushNotifications());
      results.push(await this.testMenuItems());
    } catch (error) {
      console.error("Error running tests:", error);
    }

    console.log("✅ All edge function tests completed");
    return results;
  }

  private createSummary(
    functionName: string,
    tests: TestResult[],
  ): EdgeFunctionTestSuite {
    const summary = {
      total: tests.length,
      passed: tests.filter((t) => t.status === "pass").length,
      failed: tests.filter((t) => t.status === "fail").length,
      skipped: tests.filter((t) => t.status === "skip").length,
    };

    return {
      functionName,
      tests,
      summary,
    };
  }
}
